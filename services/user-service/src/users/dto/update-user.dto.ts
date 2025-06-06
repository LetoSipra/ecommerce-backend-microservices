import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Account active ?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
