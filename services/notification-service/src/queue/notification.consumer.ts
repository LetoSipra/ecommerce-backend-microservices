import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationChannel } from 'generated/prisma';
import { NotificationService } from 'src/notification/notification.service';

interface OrderPlacedEvent {
  userId: string;
  orderId: string;
  email: string;
  total: number;
}

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(private readonly notifService: NotificationService) {}

  @EventPattern('order.placed')
  async handleOrderPlaced(@Payload() data: OrderPlacedEvent) {
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
      // No manual ack needed! NestJS handles it.
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Failed to enqueue notification: ${err.message}`);
      // No manual ack needed!
    }
  }
}
