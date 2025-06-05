// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './notification/notification.module';
import { RabbitMQModule } from './queue/rabbitmq.module';
import { NotificationConsumer } from './queue/notification.consumer';
import { NotificationProcessor } from './workers/notification.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RabbitMQModule,
    NotificationModule,
  ],
  controllers: [NotificationConsumer],
  providers: [NotificationProcessor],
})
export class AppModule {}
