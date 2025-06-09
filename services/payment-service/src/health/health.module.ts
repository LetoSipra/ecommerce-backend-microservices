// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthController } from './health.controller';
import { TerminusLogger } from './terminus-logger.service';
import { StripeHealthIndicator } from './stripe.health';
import { StripeProvider } from 'src/stripe/stripe.provider';

@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
      logger: TerminusLogger,
      gracefulShutdownTimeoutMs: 1000,
    }),
    PrismaModule,
    HttpModule,
  ],
  controllers: [HealthController],
  providers: [StripeHealthIndicator, StripeProvider],
})
export class HealthModule {}
