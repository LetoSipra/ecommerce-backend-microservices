/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Role } from 'generated/prisma';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

interface RequestWithUser extends Request {
  user?: { id: string; role: Role };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithUser>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const errorResponse: Record<string, any> = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      exceptionMessage: exception.message,
      exceptionStack: exception.stack,
      requestId: request.headers['x-request-id'],
      userId: request.user ? request.user.id : undefined,
      userRole: request.user ? request.user.role : undefined,
    };

    this.logger.error('Unhandled exception', {
      event: 'unhandled_exception',
      ...errorResponse,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: errorResponse.timestamp,
      path: errorResponse.path,
      message:
        exception instanceof HttpException
          ? typeof exception.getResponse() === 'string'
            ? exception.getResponse()
            : (exception.getResponse() as { message?: string }).message ||
              exception.message
          : 'Internal server error',
    });
  }
}
