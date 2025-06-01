import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Unique name of the category',
    example: 'Electronics',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description of the category',
    example: 'Devices, gadgets, and accessories',
  })
  description?: string;
}
