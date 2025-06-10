import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsBoolean,
  IsUrl,
  Min,
  MaxLength,
  IsInt,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'iPhone 15',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Latest Apple smartphone',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Product price',
    example: 999.99,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Unique SKU for the product',
    example: 'IPHONE15-256GB-BLACK',
  })
  @IsString()
  @MaxLength(50)
  sku: string;

  @ApiPropertyOptional({
    description: 'Image URL of the product',
    example: 'https://example.com/images/iphone15.jpg',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({
    description: 'Category ID the product belongs to',
    example: 'uuid-of-category',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'Available quantity of the product',
    example: 100,
  })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Reserved quantity of the product',
    example: 10,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  reserved?: number = 0;

  @ApiPropertyOptional({
    description: 'Is the product active?',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
