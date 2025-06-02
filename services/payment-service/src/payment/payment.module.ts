import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StripeProvider } from 'src/stripe/stripe.provider';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentController],
  providers: [PaymentService, StripeProvider],
})
export class PaymentModule {}
