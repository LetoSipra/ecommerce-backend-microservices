import { Module } from '@nestjs/common';
import { PaymentModule } from './payment/payment.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { UserVerificationGuard } from './auth/user-verification.guard';

@Module({
  imports: [PaymentModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useExisting: UserVerificationGuard,
    },
    UserVerificationGuard,
  ],
})
export class AppModule {}
