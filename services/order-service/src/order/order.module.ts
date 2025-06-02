import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductInventoryService } from './product-inventory.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrderController],
  providers: [OrderService, ProductInventoryService],
})
export class OrderModule {}
