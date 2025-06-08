/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// File: test/order.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductInventoryService } from 'src/order/product-inventory.service';
import { ClientProxy } from '@nestjs/microservices';
import * as request from 'supertest';
import { UserVerificationGuard } from 'src/auth/user-verification.guard';
import { RolesGuard } from 'src/auth/roles.guard';

// ----- Mocks ----- //

// 1) Mock inventory service: checkAvailable always resolves, decrementQuantity does nothing.
const mockInventoryService = {
  checkAvailable: jest.fn().mockResolvedValue(true),
  decrementQuantity: jest.fn().mockResolvedValue(undefined),
};

// 2) Mock RabbitMQ client proxy: just spy on emit
const mockRabbitClient: Partial<ClientProxy> = {
  emit: jest.fn(),
};

// 3) Dummy guards to bypass authentication/authorization
const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('Order Service (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // We'll keep track of IDs for cleanup and assertions
  let createdOrderId: string;
  const userId = '00000000-0000-0000-0000-000000000001';
  const productA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const productB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeAll(async () => {
    // 1) Create testing module, override providers & guards
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Override the real ProductInventoryService
      .overrideProvider(ProductInventoryService)
      .useValue(mockInventoryService)
      // Override the RabbitMQ client (injected via token 'RABBITMQ_SERVICE')
      .overrideProvider('RABBITMQ_SERVICE')
      .useValue(mockRabbitClient)
      // Override guards
      .overrideProvider(UserVerificationGuard)
      .useValue(mockAuthGuard)
      .overrideProvider(RolesGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // 2) Clean out any existing orders/items for a fresh start
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
  });

  afterAll(async () => {
    // Clean up orders/items and close the app
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await app.close();
  });

  /**
   * 1) POST /orders
   */
  it('POST /orders — should create a new order with items', async () => {
    const payload = {
      userId,
      email: 'customer@example.com', // CreateOrderDto likely includes email for Rabbit emit
      items: [
        { productId: productA, quantity: 2, price: 10.0 },
        { productId: productB, quantity: 1, price: 5.5 },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer dummy-token`)
      .send(payload)
      .expect(201);

    // --- Assertions on response body ---
    expect(res.body).toHaveProperty('id');
    expect(res.body.userId).toBe(userId);
    // total = 2*10 + 1*5.5 = 25.5
    expect(Number(res.body.total)).toBe(25.5);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(2);

    // Keep ID for later
    createdOrderId = res.body.id;

    // --- Verify inventory calls ---
    // checkAvailable called once per item
    expect(mockInventoryService.checkAvailable).toHaveBeenCalledWith(
      productA,
      2,
    );
    expect(mockInventoryService.checkAvailable).toHaveBeenCalledWith(
      productB,
      1,
    );

    // decrementQuantity is called twice per item (code calls it twice in create)
    // so total calls per product = 2
    expect(mockInventoryService.decrementQuantity).toHaveBeenCalledWith(
      productA,
      2,
    );
    expect(mockInventoryService.decrementQuantity).toHaveBeenCalledWith(
      productB,
      1,
    );

    // --- Verify Rabbit emit ---
    // ...existing code...
    const emitCall = (mockRabbitClient.emit as jest.Mock).mock.calls[0];
    expect(emitCall[0]).toBe('order.placed');
    const emittedPayload = emitCall[1];
    expect(emittedPayload).toMatchObject({
      userId,
      orderId: createdOrderId,
      email: payload.email,
    });
    expect(emittedPayload.total.toString()).toBe('25.5');
    // ...existing code...
  });

  /**
   * 2) GET /orders — should list all orders (only one exists)
   */
  it('GET /orders — should retrieve array containing the created order', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(createdOrderId);
    expect(Number(res.body[0].total)).toBe(25.5);
  });

  /**
   * 3) GET /orders/:id — should fetch the single order
   */
  it('GET /orders/:id — should retrieve the order by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/orders/${createdOrderId}`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);

    expect(res.body.id).toBe(createdOrderId);
    expect(res.body.userId).toBe(userId);
    expect(res.body.items).toHaveLength(2);

    // Check one of the items in detail
    const itemA = res.body.items.find((i) => i.productId === productA);
    expect(itemA.quantity).toBe(2);
    expect(Number(itemA.price)).toBe(10.0);
  });

  /**
   * 4) PATCH /orders/:id — should update order (e.g. status). @Roles(Role.ADMIN) is bypassed.
   */
  it('PATCH /orders/:id — should update the order status', async () => {
    const newStatus = 'SHIPPED';
    const res = await request(app.getHttpServer())
      .patch(`/orders/${createdOrderId}`)
      .set('Authorization', `Bearer dummy-token`)
      .send({ status: newStatus })
      .expect(200);

    expect(res.body.id).toBe(createdOrderId);
    expect(res.body.status).toBe(newStatus);
  });

  /**
   * 5) DELETE /orders/:id — should delete the order
   */
  it('DELETE /orders/:id — should remove the order', async () => {
    await request(app.getHttpServer())
      .delete(`/orders/${createdOrderId}`)
      .set('Authorization', `Bearer dummy-token`)
      .expect(200);

    // Confirm cascading delete: orderItem table should be empty; order should be gone
    const foundOrder = await prisma.order.findUnique({
      where: { id: createdOrderId },
    });
    expect(foundOrder).toBeNull();

    const remainingItems = await prisma.orderItem.findMany({
      where: { orderId: createdOrderId },
    });
    expect(remainingItems.length).toBe(0);
  });
});
