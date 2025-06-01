import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface UpdateCategoryFields {
  name?: string;
  description?: string;
}

@ValidatorConstraint({ name: 'atLeastOneField', async: false })
export class AtLeastOneField implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const obj = args.object as UpdateCategoryFields;
    return obj.name !== undefined || obj.description !== undefined;
  }
  defaultMessage() {
    return 'At least one field (name or description) must be provided';
  }
}
