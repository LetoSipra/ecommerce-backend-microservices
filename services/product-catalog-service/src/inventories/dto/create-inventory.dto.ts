import { ApiProperty } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({
    description: 'Product ID this inventory belongs to',
    example: 'uuid-of-product',
  })
  productId: string;

  @ApiProperty({
    description: 'Quantity in stock',
    example: 100,
    default: 0,
  })
  quantity: number;

  @ApiProperty({
    description: 'Reserved quantity',
    example: 10,
    default: 0,
  })
  reserved: number;
}
