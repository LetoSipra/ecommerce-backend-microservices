// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import metadata from './metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1) Connect RabbitMQ microservice so @EventPattern works
  const rabbitUrl = configService.get<string>('RABBITMQ_URL');
  if (!rabbitUrl) {
    throw new Error('RABBITMQ_URL is not defined in environment variables');
  }
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue: 'notifications_queue',
      queueOptions: { durable: true },
    },
  });

  await SwaggerModule.loadPluginMetadata(metadata);
  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices(); // start listening on RabbitMQ

  // 2) Start the HTTP server for REST endpoints
  await app.listen(3005, () => {
    console.log('NotificationService listening');
  });
}
bootstrap();
