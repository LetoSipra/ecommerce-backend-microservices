/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { STRIPE_CLIENT } from 'src/stripe/stripe.provider';
import * as request from 'supertest';
import Stripe from 'stripe';
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

// Mock Stripe client
const mockPaymentIntentCreate = jest.fn().mockResolvedValue({
  id: 'pi_test_123',
  status: 'requires_payment_method',
});
const mockPaymentIntentConfirm = jest.fn().mockResolvedValue({
  id: 'pi_test_123',
  status: 'succeeded',
});
const mockStripeClient: Partial<Stripe> = {
  paymentIntents: {
    create: mockPaymentIntentCreate,
    confirm: mockPaymentIntentConfirm,
  } as any,
};

describe('Payment Service (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Stub global.fetch for order-service calls
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Override Stripe client
      .overrideProvider(STRIPE_CLIENT)
      .useValue(mockStripeClient)
      // Override auth guard
      .overrideProvider(UserVerificationGuard)
      .useClass(MockUserVerificationGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    // Clean payments table
    await prisma.payment.deleteMany();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.payment.deleteMany();
    await app.close();
  });

  let createdPaymentId: string;
  const orderId = 'order_123';
  const amount = 42.5;

  it('POST /payments — should create a new payment record', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments')
      .send({ orderId, amount })
      .expect(201);

    // Validate Stripe create was called correctly
    expect(mockPaymentIntentCreate).toHaveBeenCalledWith({
      amount: Math.round(amount * 100),
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { orderId },
    });

    // Check response body (Prisma record)
    expect(res.body).toHaveProperty('id');
    expect(res.body.orderId).toBe(orderId);
    expect(Number(res.body.amount)).toBe(amount);
    expect(res.body.provider).toBe('stripe');
    expect(res.body.providerId).toBe('pi_test_123');
    expect(res.body.status).toBe('PENDING');

    createdPaymentId = res.body.id;
  });

  it('POST /payments/confirm/:providerId — should confirm payment and update order', async () => {
    const res = await request(app.getHttpServer())
      .post(`/payments/confirm/pi_test_123`)
      .set('Authorization', `Bearer dummy`)
      .expect(201);

    // Validate Stripe confirm was called
    expect(mockPaymentIntentConfirm).toHaveBeenCalledWith('pi_test_123', {
      payment_method: 'pm_card_visa',
    });

    // Check response payload
    expect(res.body).toEqual({ status: 'succeeded', id: 'pi_test_123' });

    // Verify DB status updated
    const paymentInDb = await prisma.payment.findUnique({
      where: { id: createdPaymentId },
    });
    expect(paymentInDb).not.toBeNull();
    expect(paymentInDb!.status).toBe('SUCCESS');

    // Ensure order-service was called via fetch
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/orders/${orderId}`),
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer dummy',
        }),
        body: JSON.stringify({ status: 'PAID' }),
      }),
    );
  });

  it('GET /payments — should retrieve all payments', async () => {
    const res = await request(app.getHttpServer())
      .get('/payments')
      .set('Authorization', `Bearer dummy`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(createdPaymentId);
  });

  it('GET /payments/:id — should retrieve single payment', async () => {
    const res = await request(app.getHttpServer())
      .get(`/payments/${createdPaymentId}`)
      .set('Authorization', `Bearer dummy`)
      .expect(200);

    expect(res.body.id).toBe(createdPaymentId);
    expect(res.body.orderId).toBe(orderId);
  });

  it('PATCH /payments/:id — should update payment fields', async () => {
    const newStatus = 'REFUNDED';
    const res = await request(app.getHttpServer())
      .patch(`/payments/${createdPaymentId}`)
      .set('Authorization', `Bearer dummy`)
      .send({ status: newStatus })
      .expect(200);

    expect(res.body.id).toBe(createdPaymentId);
    expect(res.body.status).toBe(newStatus);
  });

  it('DELETE /payments/:id — should delete payment', async () => {
    await request(app.getHttpServer())
      .delete(`/payments/${createdPaymentId}`)
      .set('Authorization', `Bearer dummy`)
      .expect(200);

    // Confirm deletion
    const payment = await prisma.payment.findUnique({
      where: { id: createdPaymentId },
    });
    expect(payment).toBeNull();
  });
});
