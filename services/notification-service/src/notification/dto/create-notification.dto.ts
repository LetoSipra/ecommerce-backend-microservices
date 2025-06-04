import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from 'generated/prisma';

export class CreateNotificationDto {
  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
    default: NotificationChannel.EMAIL,
    description: 'Notification channel (must be EMAIL, SMS, or PUSH)',
  })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel = NotificationChannel.EMAIL;

  @ApiProperty({
    example: 'ORDER_PLACED',
    description: 'Notification type, e.g. ORDER_PLACED, PASSWORD_RESET',
    default: 'ORDER_PLACED',
  })
  @IsString()
  @IsNotEmpty()
  type: string = 'ORDER_PLACED';

  @ApiProperty({
    example: 'user@example.com',
    description: 'Recipient email address',
    default: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  recipient: string = 'user@example.com';

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID (optional)',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    example: { orderId: 'abc123', total: 99.99 },
    description: 'Payload object or html for the notification',
    default: { orderId: 'abc123', total: 99.99 },
  })
  @IsObject()
  payload: Record<string, any> = { orderId: 'abc123', total: 99.99 };

  @ApiPropertyOptional({
    example: 'ORDER_CONFIRMATION',
    description: 'Template name or ID (optional)',
  })
  @IsOptional()
  @IsString()
  template?: string;
}
