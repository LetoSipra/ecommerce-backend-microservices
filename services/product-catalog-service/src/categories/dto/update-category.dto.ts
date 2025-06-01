import { ApiHideProperty, PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { Validate } from 'class-validator';
import { AtLeastOneField } from '../validators/at-least-one-field.validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiHideProperty()
  @Validate(AtLeastOneField)
  _atLeastOne?: unknown;
}
