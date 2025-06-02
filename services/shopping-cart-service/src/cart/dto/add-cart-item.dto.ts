import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: 'Product ID to add', example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity to add', example: 2, default: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
