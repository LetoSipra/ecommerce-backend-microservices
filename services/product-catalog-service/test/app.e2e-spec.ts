/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// File: test/product-catalog.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import * as request from 'supertest';
import { UserVerificationGuard } from 'src/auth/user-verification.guard';
import { RolesGuard } from 'src/auth/roles.guard';
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

describe('Product Catalog Microservice (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let categoryId: string;
  let productId: string;
  let inventoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Override guards so we can call admin endpoints
      .overrideProvider(UserVerificationGuard)
      .useClass(MockUserVerificationGuard)
      .overrideProvider(RolesGuard)
      .useClass(MockUserVerificationGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean tables in correct order for foreign keys
    await prisma.inventory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
  });

  afterAll(async () => {
    // Clean up created data
    await prisma.inventory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await app.close();
  });

  /**
   * 1) Categories CRUD
   */
  it('POST /categories — should create a new category', async () => {
    const res = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer dummy-token`)
      .send({ name: 'Electronics', description: 'Electronic items' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Electronics');
    expect(res.body.description).toBe('Electronic items');

    categoryId = res.body.id;
  });

  it('GET /categories — should return array with created category', async () => {
    const res = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(categoryId);
    expect(res.body[0].name).toBe('Electronics');
  });

  it('GET /categories/:id — should retrieve the category by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/categories/${categoryId}`)
      .expect(200);

    expect(res.body.id).toBe(categoryId);
    expect(res.body.name).toBe('Electronics');
    expect(res.body.products).toEqual([]);
  });

  it('PATCH /categories/:id — should update the category', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/categories/${categoryId}`)
      .set('Authorization', `Bearer dummy-token`)
      .send({ description: 'Updated electronics category' })
      .expect(200);

    expect(res.body.id).toBe(categoryId);
    expect(res.body.description).toBe('Updated electronics category');
  });

  it('DELETE /categories/:id — should delete the category', async () => {
    await request(app.getHttpServer())
      .delete(`/categories/${categoryId}`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);

    const found = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    expect(found).toBeNull();
  });

  /**
   * 2) Products CRUD
   *    Re-create category so product can reference it.
   */
  it('Re-create category for products', async () => {
    const res = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer dummy-token`)
      .send({ name: 'Appliances', description: 'Home appliances' })
      .expect(201);

    categoryId = res.body.id;
  });

  it('POST /products — should create a new product with inventory', async () => {
    const createDto = {
      name: 'Air Conditioner',
      price: 299.99,
      sku: 'AC-1234',
      categoryId,
      description: 'Cool your home',
      imageUrl: 'http://example.com/ac.png',
      isActive: true,
      quantity: 10,
      reserved: 2,
    };

    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer dummy-token`)
      .send(createDto)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Air Conditioner');
    expect(res.body.sku).toBe('AC-1234');
    expect(res.body.category.id).toBe(categoryId);
    expect(res.body.inventory.quantity).toBe(10);
    expect(res.body.inventory.reserved).toBe(2);

    productId = res.body.id;
    inventoryId = res.body.inventory.id;
  });

  it('GET /products — should return array with created product', async () => {
    const res = await request(app.getHttpServer()).get('/products').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const prod = res.body.find((p) => p.id === productId);
    expect(prod).toBeDefined();
    expect(prod.name).toBe('Air Conditioner');
  });

  it('GET /products/:id — should retrieve product by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(200);

    expect(res.body.id).toBe(productId);
    expect(res.body.sku).toBe('AC-1234');
    expect(res.body.category.id).toBe(categoryId);
    expect(res.body.inventory.id).toBe(inventoryId);
  });

  it('GET /products/category/:categoryId — should return products in category', async () => {
    const res = await request(app.getHttpServer())
      .get(`/products/category/${categoryId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].category.id).toBe(categoryId);
  });

  it('PATCH /products/:id — should update the product', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .set('Authorization', `Bearer dummy-token`)
      .send({ price: 249.99, name: 'AC Unit' })
      .expect(200);

    expect(res.body.id).toBe(productId);
    expect(Number(res.body.price)).toBe(249.99);
    expect(res.body.name).toBe('AC Unit');
  });

  it('DELETE /products/:id — should delete the product', async () => {
    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);

    const found = await prisma.product.findUnique({ where: { id: productId } });
    expect(found).toBeNull();
  });

  /**
   * 3) Inventories CRUD
   *    Re-create product so inventory exists again.
   */
  it('Re-create product (with inventory) for inventory tests', async () => {
    const createDto = {
      name: 'Refrigerator',
      price: 499.99,
      sku: 'RF-5678',
      categoryId,
      description: 'Keep your food cold',
      imageUrl: 'http://example.com/rf.png',
      isActive: true,
      quantity: 20,
      reserved: 5,
    };

    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer dummy-token`)
      .send(createDto)
      .expect(201);

    productId = res.body.id;
    inventoryId = res.body.inventory.id;
  });

  it('GET /inventories/by-product/:productId — should return inventory by product ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/inventories/by-product/${productId}`)
      .expect(200);

    expect(res.body.id).toBe(inventoryId);
    expect(res.body.quantity).toBe(20);
    expect(res.body.reserved).toBe(5);
    expect(res.body.product.id).toBe(productId);
  });

  it('PATCH /inventories/by-product/:productId — should increment/decrement inventory fields', async () => {
    // Increase quantity by 5, decrease reserved by 2
    const updateDto = { incrementQuantity: 5, decrementReserved: 2 };
    const res = await request(app.getHttpServer())
      .patch(`/inventories/by-product/${productId}`)
      .send(updateDto)
      .expect(200);

    expect(res.body.id).toBe(inventoryId);
    expect(res.body.quantity).toBe(25); // 20 + 5
    expect(res.body.reserved).toBe(3); // 5 - 2
  });

  it('GET /inventories/:id — should retrieve inventory by its ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/inventories/${inventoryId}`)
      .expect(200);

    expect(res.body.id).toBe(inventoryId);
    expect(res.body.productId).toBe(productId);
    expect(res.body.quantity).toBe(25);
    expect(res.body.reserved).toBe(3);
  });

  it('PATCH /inventories/:id — should update inventory fields directly', async () => {
    // Set quantity=30, reserved=1
    const res = await request(app.getHttpServer())
      .patch(`/inventories/${inventoryId}`)
      .set('Authorization', `Bearer dummy-token`)
      .send({ quantity: 30, reserved: 1 })
      .expect(200);

    expect(res.body.id).toBe(inventoryId);
    expect(res.body.quantity).toBe(30);
    expect(res.body.reserved).toBe(1);
  });

  it('DELETE /inventories/:id — should delete the inventory', async () => {
    await request(app.getHttpServer())
      .delete(`/inventories/${inventoryId}`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);

    const found = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });
    expect(found).toBeNull();
  });
});
