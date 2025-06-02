import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { Cart, CartItem } from 'generated/prisma';
import { ProductInventoryService } from './product-inventory.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productInventory: ProductInventoryService,
  ) {}

  // Get or create a cart for a user
  async getOrCreateCartByUser(
    userId: string,
  ): Promise<Cart & { items: CartItem[] }> {
    try {
      let cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
          include: { items: true },
        });
      }
      return cart;
    } catch {
      throw new BadRequestException('Failed to get or create cart');
    }
  }

  // Add or update an item in the user's cart, and update reserved inventory
  async addOrUpdateItem(
    userId: string,
    dto: AddCartItemDto,
  ): Promise<CartItem> {
    try {
      const cart = await this.getOrCreateCartByUser(userId);

      const existingItem = await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: dto.productId,
          },
        },
      });

      // Calculate the difference for reserved logic
      let reserveDiff = dto.quantity;
      if (existingItem) {
        reserveDiff = dto.quantity - existingItem.quantity;
      }

      // Only call product service if reserveDiff is not zero
      if (reserveDiff > 0) {
        await this.productInventory.reserveProduct(dto.productId, reserveDiff);
      } else if (reserveDiff < 0) {
        await this.productInventory.releaseProduct(
          dto.productId,
          Math.abs(reserveDiff),
        );
      }

      if (existingItem) {
        return await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: dto.quantity },
        });
      } else {
        return await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: dto.productId,
            quantity: dto.quantity,
          },
        });
      }
    } catch {
      throw new BadRequestException('Failed to add or update cart item');
    }
  }

  // Remove an item from the user's cart and release reserved inventory
  async removeItem(userId: string, productId: string): Promise<CartItem> {
    try {
      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) throw new NotFoundException('Cart not found');
      const item = await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });
      if (!item) throw new NotFoundException('Cart item not found');

      // Release reserved quantity
      await this.productInventory.releaseProduct(productId, item.quantity);

      return await this.prisma.cartItem.delete({ where: { id: item.id } });
    } catch {
      throw new BadRequestException('Failed to remove cart item');
    }
  }

  // Clear all items from the user's cart and release all reserved inventory
  async clearCart(userId: string): Promise<{ count: number }> {
    try {
      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) throw new NotFoundException('Cart not found');
      const items = await this.prisma.cartItem.findMany({
        where: { cartId: cart.id },
      });

      for (const item of items) {
        await this.productInventory.releaseProduct(
          item.productId,
          item.quantity,
        );
      }

      return await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    } catch {
      throw new BadRequestException('Failed to clear cart');
    }
  }
}
