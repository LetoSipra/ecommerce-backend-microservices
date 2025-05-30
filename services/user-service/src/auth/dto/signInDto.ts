import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignInDto {
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
}
