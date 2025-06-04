// src/notification/notification.controller.ts

import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from 'generated/prisma';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifService: NotificationService) {}

  @Post()
  async enqueue(@Body() dto: CreateNotificationDto) {
    try {
      const notification = await this.notifService.createViaRest(dto);
      // Immediately process this notification and return the result
      const result = await this.notifService.sendAndMark(notification.id);
      return { notification, result };
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(err.message);
    }
  }
}
