import { Module } from '@nestjs/common';
import { CartModule } from './cart/cart.module';
import { APP_GUARD } from '@nestjs/core';
import { UserVerificationGuard } from './auth/user-verification.guard';

@Module({
  imports: [CartModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserVerificationGuard,
    },
  ],
})
export class AppModule {}
