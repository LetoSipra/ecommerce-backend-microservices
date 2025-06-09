import { Module } from '@nestjs/common';
import { PaymentModule } from './payment/payment.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { UserVerificationGuard } from './auth/user-verification.guard';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { LoggerModule } from './logger/logger.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PaymentModule,
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useExisting: UserVerificationGuard,
    },
    UserVerificationGuard,
    AllExceptionsFilter,
  ],
})
export class AppModule {}
