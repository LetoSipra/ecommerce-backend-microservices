import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { NotificationChannel } from 'generated/prisma';
import { NotificationService } from 'src/notification/notification.service';
import type { ConfirmChannel, Message } from 'amqplib';

interface OrderPlacedEvent {
  userId: string;
  orderId: string;
  email: string;
  total: number;
}

@Injectable()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(private readonly notifService: NotificationService) {}

  @EventPattern('order.placed')
  async handleOrderPlaced(
    @Payload() data: OrderPlacedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channelRef = context.getChannelRef() as ConfirmChannel;
    const originalMsg = context.getMessage() as Message;

    this.logger.log(`Received 'order.placed' event: ${JSON.stringify(data)}`);

    try {
      const { userId, orderId, email, total } = data;
      await this.notifService.enqueueIfNotDuplicate({
        channel: NotificationChannel.EMAIL,
        type: 'ORDER_PLACED',
        recipient: email,
        userId,
        template: 'ORDER_CONFIRMATION',
        payload: { orderId, total, userId },
      });
      channelRef.ack(originalMsg);
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Failed to enqueue notification: ${err.message}`);
      channelRef.ack(originalMsg);
    }
  }
}
