import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import metadata from './metadata';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalFilters(app.get(AllExceptionsFilter));

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
    .setTitle('Notification Service')
    .setDescription(
      'Microservice for handling notifications in the ecommerce platform.',
    )
    .setVersion('1.0')
    .addServer('/notification-service')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices();

  await app.listen(3005, () => {
    console.log('NotificationService listening');
  });
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
