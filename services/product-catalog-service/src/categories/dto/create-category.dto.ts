import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Unique name of the category',
    example: 'Electronics',
  })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description of the category',
    example: 'Devices, gadgets, and accessories',
  })
  @IsString()
  @MaxLength(100)
  description?: string;
}
