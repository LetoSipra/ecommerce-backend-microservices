import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsOptional } from 'class-validator';

export class UpdateCartItemDto {
  @ApiPropertyOptional({ description: 'Quantity to update', example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
