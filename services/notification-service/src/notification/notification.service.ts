// src/notification/notification.service.ts

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { EtherealMailService } from 'src/providers/ethereal-mail.provider';
import { Notification, NotificationStatus } from 'generated/prisma';

// ...existing imports...

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly MAX_RETRIES = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ethereal: EtherealMailService,
  ) {}

  async findAll(): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Enqueue a notification only if no active one exists with same (type, recipient, payload).
   * Uses Prisma JSON path queries for payload fields.
   */
  async enqueueIfNotDuplicate(
    dto: CreateNotificationDto,
  ): Promise<Notification> {
    try {
      // Use JSON path queries for payload fields (orderId, total)
      type PayloadType = { orderId?: string | number; total?: number };
      const payload = dto.payload as PayloadType | undefined;
      const andPayload: Array<Record<string, unknown>> = [];
      if (payload?.orderId !== undefined) {
        andPayload.push({
          payload: {
            path: ['orderId'],
            equals: payload.orderId,
            not: undefined,
          },
        });
      }
      if (payload?.total !== undefined) {
        andPayload.push({
          payload: {
            path: ['total'],
            equals: payload.total,
            not: undefined,
          },
        });
      }

      const existing = await this.prisma.notification.findFirst({
        where: {
          type: dto.type,
          recipient: dto.recipient,
          status: {
            in: [NotificationStatus.PENDING, NotificationStatus.IN_PROGRESS],
          },
          ...(andPayload.length > 0 ? { AND: andPayload } : {}),
        },
      });
      if (existing) {
        this.logger.log(
          `Duplicate skip: type=${dto.type}, recipient=${dto.recipient}`,
        );
        return existing;
      }

      return await this.prisma.notification.create({
        data: {
          channel: dto.channel,
          type: dto.type,
          recipient: dto.recipient,
          userId: dto.userId,
          payload: dto.payload,
          template: dto.template,
          status: NotificationStatus.PENDING,
        },
      });
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(err.message);
    }
  }

  /**
   * Called by REST endpoint for manual enqueue.
   */
  async createViaRest(dto: CreateNotificationDto): Promise<Notification> {
    return this.enqueueIfNotDuplicate(dto);
  }

  async sendAndMark(id: string) {
    const item = await this.prisma.notification.findUnique({ where: { id } });
    if (!item) throw new BadRequestException('Notification not found');
    try {
      await this.prisma.notification.update({
        where: { id: item.id },
        data: {
          status: NotificationStatus.IN_PROGRESS,
          attempts: { increment: 1 },
        },
      });

      const result = await this.ethereal.sendMail({
        to: item.recipient,
        subject: item.type,
        html:
          typeof item.payload === 'string'
            ? item.payload
            : JSON.stringify(item.payload ?? ''),
      });

      await this.prisma.notification.update({
        where: { id: item.id },
        data: {
          status: NotificationStatus.SUCCESS,
          providerId: result.messageId,
          sentAt: result.timestamp,
        },
      });

      return result; // includes messageId, previewUrl, timestamp
    } catch (err: any) {
      await this.prisma.notification.update({
        where: { id: item.id },
        data: {
          status: NotificationStatus.FAILED,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          lastError: (err.message || '').slice(0, 255),
        },
      });
      throw err;
    }
  }

  /**
   * Called by Cron job to process up to N pending notifications.
   */
  async processPendingBatch(batchSize = 10): Promise<void> {
    const pendings = await this.prisma.notification.findMany({
      where: { status: NotificationStatus.PENDING },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });

    for (const item of pendings) {
      try {
        // 1) Mark IN_PROGRESS + increment attempts
        await this.prisma.notification.update({
          where: { id: item.id },
          data: {
            status: NotificationStatus.IN_PROGRESS,
            attempts: { increment: 1 },
          },
        });

        // 2) Send email via Ethereal
        const result = await this.ethereal.sendMail({
          to: item.recipient,
          subject: item.type,
          html:
            typeof item.payload === 'string'
              ? item.payload
              : JSON.stringify(item.payload ?? ''),
        });

        // 3) Mark SUCCESS
        await this.prisma.notification.update({
          where: { id: item.id },
          data: {
            status: NotificationStatus.SUCCESS,
            providerId: result.messageId,
            sentAt: result.timestamp,
          },
        });
        this.logger.log(
          `Notification ${item.id} sent (providerId=${result.messageId})`,
        );
      } catch (err: any) {
        this.logger.error(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `Failed to send notification ${item.id}: ${err.message}`,
        );
        const newAttempts = item.attempts + 1;
        const newStatus =
          newAttempts >= this.MAX_RETRIES
            ? NotificationStatus.FAILED
            : NotificationStatus.PENDING;

        await this.prisma.notification.update({
          where: { id: item.id },
          data: {
            status: newStatus,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            lastError: (err.message || '').slice(0, 255),
          },
        });
      }
    }
  }
}
