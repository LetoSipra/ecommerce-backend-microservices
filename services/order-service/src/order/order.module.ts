import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductInventoryService } from './product-inventory.service';
import { RabbitMQModule } from 'src/queue/rabbitmq.module';

@Module({
  imports: [PrismaModule, RabbitMQModule],
  controllers: [OrderController],
  providers: [OrderService, ProductInventoryService],
})
export class OrderModule {}
