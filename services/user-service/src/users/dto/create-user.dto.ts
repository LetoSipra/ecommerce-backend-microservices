import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from 'generated/prisma';

export class CreateUserDto {
  @ApiProperty({
    example: 'alice@example.com',
    description: 'Unique user email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'User password, min length 8',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Alice', description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Smith', description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiProperty({
    enum: Role,
    example: Role.CUSTOMER,
    description: 'Role of the user',
  })
  @IsEnum(Role)
  role: Role;
}
