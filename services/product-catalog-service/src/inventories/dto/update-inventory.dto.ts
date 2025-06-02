import {
  ApiHideProperty,
  ApiPropertyOptional,
  PartialType,
} from '@nestjs/swagger';
import { CreateInventoryDto } from './create-inventory.dto';
import { AtLeastOneField } from 'src/validators/at-least-one-field.validator';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateInventoryDto extends PartialType(CreateInventoryDto) {
  @ApiHideProperty()
  @AtLeastOneField([
    'quantity',
    'reserved',
    'productId',
    'incrementQuantity',
    'decrementQuantity',
    'incrementReserved',
    'decrementReserved',
  ])
  _atLeastOne?: unknown;

  @ApiPropertyOptional({ description: 'Increment quantity by this value' })
  @IsOptional()
  @IsNumber()
  incrementQuantity?: number;

  @ApiPropertyOptional({ description: 'Decrement quantity by this value' })
  @IsOptional()
  @IsNumber()
  decrementQuantity?: number;

  @ApiPropertyOptional({ description: 'Increment reserved by this value' })
  @IsOptional()
  @IsNumber()
  incrementReserved?: number;

  @ApiPropertyOptional({ description: 'Decrement reserved by this value' })
  @IsOptional()
  @IsNumber()
  decrementReserved?: number;
}
