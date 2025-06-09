import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { APP_GUARD } from '@nestjs/core';
import { UserVerificationGuard } from './auth/user-verification.guard';
import { RolesGuard } from './auth/roles.guard';
import { LoggerModule } from './logger/logger.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { HealthModule } from './health/health.module';

@Module({
  imports: [OrderModule, LoggerModule, HealthModule, HealthModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useExisting: UserVerificationGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
    UserVerificationGuard,
    RolesGuard,
    AllExceptionsFilter,
  ],
})
export class AppModule {}
