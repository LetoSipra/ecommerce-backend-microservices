import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signInDto';
import { Public } from './constants/authPublicMetadata';
import { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';

export interface JwtPayload {
  id: string;
  role: string;
  // add other fields if needed
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }
  @ApiBearerAuth('jwt')
  @Get('verify')
  //Global auth-guard active for non public routes
  verifyToken(@Req() req: Request & { user: JwtPayload }) {
    return {
      ok: true,
      user: {
        id: req.user.id,
        role: req.user.role,
      },
    };
  }
}
