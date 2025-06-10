import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductInventoryService } from './product-inventory.service';

@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartService, ProductInventoryService],
})
export class CartModule {}
