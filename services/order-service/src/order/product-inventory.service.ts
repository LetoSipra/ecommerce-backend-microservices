import { Injectable, BadRequestException } from '@nestjs/common';

const PRODUCT_SERVICE_URL = 'http://localhost:3000';

interface ProductInventory {
  quantity: number;
  reserved?: number;
  [key: string]: unknown;
}

@Injectable()
export class ProductInventoryService {
  async getInventory(productId: string): Promise<ProductInventory> {
    const res = await fetch(
      `${PRODUCT_SERVICE_URL}/inventories/by-product/${productId}`,
    );
    if (!res.ok) {
      const errorText = await res.text();
      console.error('fetch failed', res.status, errorText); // <-- Add this line
      throw new BadRequestException('Failed to fetch product inventory');
    }
    return res.json() as Promise<ProductInventory>;
  }

  async checkAvailable(productId: string, requestedQuantity: number) {
    const inventory = await this.getInventory(productId);
    const available = inventory.quantity - (inventory.reserved ?? 0);
    if (available < requestedQuantity) {
      throw new BadRequestException(
        `Not enough inventory for product ${productId}. Requested: ${requestedQuantity}, Available: ${available}`,
      );
    }
    return true;
  }

  async updateInventory(productId: string, update: Record<string, unknown>) {
    const res = await fetch(
      `${PRODUCT_SERVICE_URL}/inventories/by-product/${productId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      },
    );
    if (!res.ok) {
      const errorText = await res.text();
      console.error('fetch failed', res.status, errorText);
      throw new BadRequestException('Failed to update product inventory');
    }
  }

  async reserveProduct(productId: string, quantity: number) {
    return this.updateInventory(productId, { incrementReserved: quantity });
  }

  async releaseProduct(productId: string, quantity: number) {
    return this.updateInventory(productId, { decrementReserved: quantity });
  }

  async incrementQuantity(productId: string, quantity: number) {
    return this.updateInventory(productId, { incrementQuantity: quantity });
  }

  async decrementQuantity(productId: string, quantity: number) {
    return this.updateInventory(productId, { decrementQuantity: quantity });
  }
}
