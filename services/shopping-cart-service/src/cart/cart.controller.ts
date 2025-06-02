import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('jwt')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('user/:userId')
  getCartByUser(@Param('userId') userId: string) {
    return this.cartService.getOrCreateCartByUser(userId);
  }

  @Post('user/:userId/items')
  addOrUpdateItem(
    @Param('userId') userId: string,
    @Body() addCartItemDto: AddCartItemDto,
  ) {
    return this.cartService.addOrUpdateItem(userId, addCartItemDto);
  }

  @Delete('user/:userId/items/:productId')
  removeItem(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(userId, productId);
  }

  @Delete('user/:userId/items')
  clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
