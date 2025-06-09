import { Module } from '@nestjs/common';
import { CartModule } from './cart/cart.module';
import { APP_GUARD } from '@nestjs/core';
import { UserVerificationGuard } from './auth/user-verification.guard';
import { LoggerModule } from './logger/logger.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { HealthModule } from './health/health.module';

@Module({
  imports: [CartModule, LoggerModule, HealthModule],
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
