import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID', example: 'uuid-of-order' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Payment amount', example: 99.99 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Stripe customer ID', required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ description: 'Stripe receipt URL', required: false })
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
