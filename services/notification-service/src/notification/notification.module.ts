// src/notification/notification.module.ts

import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { EtherealMailModule } from 'src/providers/ethereal-mail.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [EtherealMailModule, PrismaModule],
  providers: [NotificationService, PrismaService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
