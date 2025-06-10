import { ApiHideProperty, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { AtLeastOneField } from 'src/validators/at-least-one-field.validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiHideProperty()
  @AtLeastOneField([
    'name',
    'price',
    'sku',
    'description',
    'imageUrl',
    'isActive',
    'categoryId',
  ])
  _atLeastOne?: unknown;
}
