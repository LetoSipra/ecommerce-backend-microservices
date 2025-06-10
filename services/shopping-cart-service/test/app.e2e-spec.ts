/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductInventoryService } from 'src/cart/product-inventory.service';
import * as request from 'supertest';
import { UserVerificationGuard } from 'src/auth/user-verification.guard';
import { Reflector } from '@nestjs/core';

class MockUserVerificationGuard {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    interface TestUser {
      id: string;
      role: string;
    }
    const req: { user?: TestUser } = context.switchToHttp().getRequest();
    req.user = { id: 'test-user', role: 'CUSTOMER' };
    return true;
  }
}

// A simple mock that always returns success for inventory operations
const mockInventoryService = {
  updateInventory: jest.fn().mockResolvedValue(undefined),
  reserveProduct: jest.fn().mockResolvedValue(undefined),
  releaseProduct: jest.fn().mockResolvedValue(undefined),
  incrementQuantity: jest.fn().mockResolvedValue(undefined),
  decrementQuantity: jest.fn().mockResolvedValue(undefined),
};

describe('Shopping Cart Service (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // These IDs are used throughout the test
  const userId = '00000000-0000-0000-0000-000000000001';
  const productA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const productB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Override the real ProductInventoryService
      .overrideProvider(ProductInventoryService)
      .useValue(mockInventoryService)
      .overrideProvider(UserVerificationGuard)
      .useClass(MockUserVerificationGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    // Clean existing cart data for our test user
    await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
    await prisma.cart.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
    await prisma.cart.deleteMany({ where: { userId } });
    await app.close();
  });

  it('GET /cart/user/:userId — should create a new empty cart', async () => {
    const res = await request(app.getHttpServer())
      .get(`/cart/user/${userId}`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body.userId).toBe(userId);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(0);
  });

  it('POST /cart/user/:userId/items — should add an item', async () => {
    const payload = { productId: productA, quantity: 3 };
    const res = await request(app.getHttpServer())
      .post(`/cart/user/${userId}/items`)
      .set('Authorization', `Bearer dummy-token`)
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.productId).toBe(productA);
    expect(res.body.quantity).toBe(3);
    expect(mockInventoryService.reserveProduct).toHaveBeenCalledWith(
      productA,
      3,
    );
  });

  it('GET /cart/user/:userId — should return one item', async () => {
    const res = await request(app.getHttpServer())
      .get(`/cart/user/${userId}`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    const item = res.body.items[0];
    expect(item.productId).toBe(productA);
    expect(item.quantity).toBe(3);
  });

  it('POST /cart/user/:userId/items — should update existing item quantity', async () => {
    // Increase from 3 → 5 (reserveDiff = 2)
    const payload = { productId: productA, quantity: 5 };
    const res = await request(app.getHttpServer())
      .post(`/cart/user/${userId}/items`)
      .set('Authorization', `Bearer dummy-token`)
      .send(payload)
      .expect(201);

    expect(res.body.productId).toBe(productA);
    expect(res.body.quantity).toBe(5);
    expect(mockInventoryService.reserveProduct).toHaveBeenCalledWith(
      productA,
      2,
    );
  });

  it('POST /cart/user/:userId/items — should reduce quantity and release inventory', async () => {
    // Decrease from 5 → 2 (reserveDiff = -3)
    const payload = { productId: productA, quantity: 2 };
    const res = await request(app.getHttpServer())
      .post(`/cart/user/${userId}/items`)
      .set('Authorization', `Bearer dummy-token`)
      .send(payload)
      .expect(201);

    expect(res.body.productId).toBe(productA);
    expect(res.body.quantity).toBe(2);
    expect(mockInventoryService.releaseProduct).toHaveBeenCalledWith(
      productA,
      3,
    );
  });

  it('POST /cart/user/:userId/items — should add a second product', async () => {
    const payloadB = { productId: productB, quantity: 1 };
    const res = await request(app.getHttpServer())
      .post(`/cart/user/${userId}/items`)
      .set('Authorization', `Bearer dummy-token`)
      .send(payloadB)
      .expect(201);

    expect(res.body.productId).toBe(productB);
    expect(res.body.quantity).toBe(1);
    expect(mockInventoryService.reserveProduct).toHaveBeenCalledWith(
      productB,
      1,
    );
  });

  it('GET /cart/user/:userId — should list two items', async () => {
    const res = await request(app.getHttpServer())
      .get(`/cart/user/${userId}`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);

    const items = res.body.items;
    expect(items).toHaveLength(2);
    const foundA = items.find((i) => i.productId === productA);
    const foundB = items.find((i) => i.productId === productB);
    expect(foundA.quantity).toBe(2);
    expect(foundB.quantity).toBe(1);
  });

  it('DELETE /cart/user/:userId/items/:productId — should remove productB', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/cart/user/${userId}/items/${productB}`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);

    expect(res.body.productId).toBe(productB);
    expect(res.body.quantity).toBe(1);
    expect(mockInventoryService.releaseProduct).toHaveBeenCalledWith(
      productB,
      1,
    );

    const cartAfter = await request(app.getHttpServer())
      .get(`/cart/user/${userId}`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);
    expect(cartAfter.body.items).toHaveLength(1);
    expect(cartAfter.body.items[0].productId).toBe(productA);
  });

  it('DELETE /cart/user/:userId/items — should clear all items', async () => {
    const clearRes = await request(app.getHttpServer())
      .delete(`/cart/user/${userId}/items`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);

    expect(clearRes.body).toHaveProperty('count');
    expect(clearRes.body.count).toBe(1);
    expect(mockInventoryService.releaseProduct).toHaveBeenCalledWith(
      productA,
      2,
    );

    const finalCart = await request(app.getHttpServer())
      .get(`/cart/user/${userId}`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);
    expect(finalCart.body.items).toHaveLength(0);
  });
});
