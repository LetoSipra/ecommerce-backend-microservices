/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { EtherealMailService } from 'src/providers/ethereal-mail.provider';
import * as request from 'supertest';

describe('Notification Service (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Mock sendMail result
  const mockSendMailResult = {
    messageId: 'msg_test_123',
    previewUrl: 'http://preview.test',
    timestamp: new Date().toISOString(),
  };

  // Replace EtherealMailService with this mock
  const mockEtherealService = {
    sendMail: jest.fn().mockResolvedValue(mockSendMailResult),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Override EtherealMailService so no real email is sent
      .overrideProvider(EtherealMailService)
      .useValue(mockEtherealService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    // Clean up any existing notifications
    await prisma.notification.deleteMany();
  });

  afterAll(async () => {
    // Remove notifications after tests
    await prisma.notification.deleteMany();
    await app.close();
  });

  let createdNotificationId: string;

  // Sample CreateNotificationDto
  const createDto = {
    channel: 'EMAIL',
    type: 'ORDER_CONFIRMATION',
    recipient: 'user@example.com',
    userId: '00000000-0000-0000-0000-000000000001',
    payload: { orderId: 'order_123', total: 55.5 },
    template: 'order-confirm-template',
  };

  it('POST /notifications — should enqueue and send notification', async () => {
    const res = await request(app.getHttpServer())
      .post('/notifications')
      .send(createDto)
      .expect(201);

    // Response: { notification, result }
    expect(res.body).toHaveProperty('notification');
    expect(res.body).toHaveProperty('result');

    const { notification, result } = res.body;

    // Check the enqueued notification (before sending)
    expect(notification).toHaveProperty('id');
    expect(notification.channel).toBe(createDto.channel);
    expect(notification.type).toBe(createDto.type);
    expect(notification.recipient).toBe(createDto.recipient);
    expect(notification.userId).toBe(createDto.userId);
    expect(notification.payload).toEqual(createDto.payload);
    expect(notification.template).toBe(createDto.template);
    expect(notification.status).toBe('PENDING');
    expect(notification.attempts).toBe(0);

    createdNotificationId = notification.id;

    // Check the sendMail result
    expect(result).toHaveProperty('messageId', mockSendMailResult.messageId);
    expect(result).toHaveProperty('previewUrl', mockSendMailResult.previewUrl);
    expect(result).toHaveProperty('timestamp', mockSendMailResult.timestamp);

    // Verify that EtherealMailService.sendMail was called with correct arguments
    const sendMailCall = (mockEtherealService.sendMail as jest.Mock).mock
      .calls[0][0];
    expect(sendMailCall.to).toBe(createDto.recipient);
    expect(sendMailCall.subject).toBe(createDto.type);
    expect(JSON.parse(sendMailCall.html)).toEqual(createDto.payload);
  });

  it('GET /notifications — should return array with updated notification', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const notif = res.body[0];
    expect(notif.id).toBe(createdNotificationId);
    expect(notif.status).toBe('SUCCESS');
    expect(notif.providerId).toBe(mockSendMailResult.messageId);
    // Prisma stores sentAt as a Date, so ensure ISO string matches mock timestamp
    expect(new Date(notif.sentAt).toISOString()).toBe(
      mockSendMailResult.timestamp,
    );
    expect(notif.attempts).toBe(1);
  });
});
