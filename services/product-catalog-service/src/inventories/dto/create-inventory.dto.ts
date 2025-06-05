import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min } from 'class-validator';

export class CreateInventoryDto {
  @ApiProperty({
    description: 'Product ID this inventory belongs to',
    example: 'uuid-of-product',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity in stock',
    example: 100,
    default: 0,
  })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Reserved quantity',
    example: 10,
    default: 0,
  })
  @IsInt()
  @Min(0)
  reserved: number;
}
