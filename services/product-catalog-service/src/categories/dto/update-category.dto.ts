import { ApiHideProperty, PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { AtLeastOneField } from 'src/validators/at-least-one-field.validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiHideProperty()
  @AtLeastOneField(['name', 'description'])
  _atLeastOne?: unknown;
}
