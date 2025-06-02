import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { APP_GUARD } from '@nestjs/core';
import { UserVerificationGuard } from './auth/user-verification.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [OrderModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserVerificationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
