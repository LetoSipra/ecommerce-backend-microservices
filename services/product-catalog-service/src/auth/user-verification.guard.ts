import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { Role } from './role.enum';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorator/public.decorator';

@Injectable()
export class UserVerificationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();

    const auth = req.headers['authorization'] as string;

    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or malformed Authorization header',
      );
    }

    try {
      // Use native fetch to call user service
      const response = await fetch('http://localhost:3001/auth/verify', {
        headers: { Authorization: auth },
      });

      if (!response.ok) {
        throw new UnauthorizedException('User service verification failed');
      }

      const data = (await response.json()) as {
        user?: { id: string; role: Role };
      };

      const user = data?.user;
      if (!user || !user.id || !user.role) {
        throw new UnauthorizedException('Invalid user data from auth service');
      }

      if (!['ADMIN', 'CUSTOMER'].includes(user.role)) {
        throw new ForbiddenException('Insufficient role');
      }

      req.user = user;
      return true;
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
