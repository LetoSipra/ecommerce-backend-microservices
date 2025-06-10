// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthController } from './health.controller';
import { TerminusLogger } from './terminus-logger.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
      logger: TerminusLogger,
      gracefulShutdownTimeoutMs: 1000,
    }),
    PrismaModule,
    HttpModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
