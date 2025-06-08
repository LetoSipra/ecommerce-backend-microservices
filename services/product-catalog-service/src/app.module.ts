import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { APP_GUARD } from '@nestjs/core';
import { UserVerificationGuard } from './auth/user-verification.guard';
import { RolesGuard } from './auth/roles.guard';
import { ProductsModule } from './products/products.module';
import { InventoriesModule } from './inventories/inventories.module';

@Module({
  imports: [CategoriesModule, ProductsModule, InventoriesModule],
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
  ],
  exports: [],
})
export class AppModule {}
