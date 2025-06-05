import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderItem } from 'generated/prisma';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { ProductInventoryService } from './product-inventory.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productInventory: ProductInventoryService,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
  ): Promise<Order & { items: OrderItem[] }> {
    try {
      const { userId, items } = createOrderDto;

      if (!items || items.length === 0) {
        throw new BadRequestException('Order must have at least one item');
      }

      // Calculate total
      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Create order and items
      const order = await this.prisma.order.create({
        data: {
          userId,
          total,
          items: {
            create: items.map((item: CreateOrderItemDto) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of items) {
        await this.productInventory.checkAvailable(
          item.productId,
          item.quantity,
        );
        await this.productInventory.decrementQuantity(
          item.productId,
          item.quantity,
        );
      }

      // Decrement stock for each item
      for (const item of items) {
        await this.productInventory.decrementQuantity(
          item.productId,
          item.quantity,
        );
      }

      this.rabbitClient.emit('order.placed', {
        userId: order.userId,
        orderId: order.id,
        email: createOrderDto.email,
        total: order.total,
      });

      return order;
    } catch (err) {
      console.error('Order creation error:', err);
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new BadRequestException('Failed to create order');
    }
  }

  // Get all orders
  async findAll(): Promise<(Order & { items: OrderItem[] })[]> {
    try {
      return await this.prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      throw new BadRequestException('Failed to fetch orders');
    }
  }

  // Get a single order by ID
  async findOne(id: string): Promise<Order & { items: OrderItem[] }> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      return order;
    } catch {
      throw new BadRequestException('Failed to fetch order');
    }
  }

  // Update order (typically only status)
  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (!order) throw new NotFoundException('Order not found');

      return await this.prisma.order.update({
        where: { id },
        data: updateOrderDto,
      });
    } catch {
      throw new BadRequestException('Failed to update order');
    }
  }

  // Remove an order
  async remove(id: string): Promise<Order> {
    try {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (!order) throw new NotFoundException('Order not found');
      return await this.prisma.order.delete({ where: { id } });
    } catch {
      throw new BadRequestException('Failed to remove order');
    }
  }
}
