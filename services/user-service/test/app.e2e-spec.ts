/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'generated/prisma';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    // Ensure a clean test database state
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('/users (POST) -> create user', async () => {
    const createDto = {
      email: 'e2e@example.com',
      password: 'password',
      firstName: 'E2E',
      lastName: 'Test',
      role: Role.CUSTOMER,
    };
    const response = await request(app.getHttpServer())
      .post('/users')
      .send(createDto)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toMatchObject({
      email: createDto.email,
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      role: createDto.role,
    });
    expect(response.body).toHaveProperty('token');
  });

  it('/users (GET) -> get all users (protected)', async () => {
    // First, create a user to obtain JWT
    const { body } = await request(app.getHttpServer()).post('/users').send({
      email: 'auth@example.com',
      password: 'password',
      firstName: 'Auth',
      lastName: 'User',
      role: Role.CUSTOMER,
    });

    const token = body.token;
    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  it('/users/:id (GET) -> get user by id (protected)', async () => {
    // Create a user
    const { body: createBody } = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'find@example.com',
        password: 'password',
        firstName: 'Find',
        lastName: 'Test',
        role: Role.CUSTOMER,
      });

    const token = createBody.token;
    const userId = createBody.user.id;

    const response = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: userId,
      email: 'find@example.com',
    });
  });

  it('/users/:id (PATCH) -> update user (protected)', async () => {
    // Create a user
    const { body: createBody } = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'update@example.com',
        password: 'password',
        firstName: 'Before',
        lastName: 'User',
        role: Role.CUSTOMER,
      });

    const token = createBody.token;
    const userId = createBody.user.id;

    const response = await request(app.getHttpServer())
      .patch(`/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'After' })
      .expect(200);

    expect(response.body.user).toMatchObject({
      id: userId,
      firstName: 'After',
    });
  });

  it('/users/:id (DELETE) -> delete user (protected)', async () => {
    // Create a user
    const { body: createBody } = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'delete@example.com',
        password: 'password',
        firstName: 'Delete',
        lastName: 'User',
        role: Role.CUSTOMER,
      });

    const token = createBody.token;
    const userId = createBody.user.id;

    const response = await request(app.getHttpServer())
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: userId,
      email: 'delete@example.com',
    });
  });
});
