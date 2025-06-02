import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateCartDto {
  @ApiProperty({ description: 'User ID for the cart', example: 'uuid-of-user' })
  @IsUUID()
  userId: string;
}
