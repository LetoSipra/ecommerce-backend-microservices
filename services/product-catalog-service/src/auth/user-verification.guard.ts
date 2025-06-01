import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

// Extend the Request interface to include 'user'
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}

@Injectable()
export class UserVerificationGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
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
        user?: { id: string; role: string };
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
