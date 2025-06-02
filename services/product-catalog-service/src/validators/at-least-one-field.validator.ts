import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function AtLeastOneField(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOneField',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const obj = args.object as Record<string, unknown>;
          return fields.some((field) => obj[field] !== undefined);
        },
        defaultMessage() {
          return `At least one of the following fields must be provided: ${fields.join(', ')}`;
        },
      },
    });
  };
}
