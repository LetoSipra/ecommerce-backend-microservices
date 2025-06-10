import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
  PrismaHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  MicroserviceHealthIndicator,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
    private prismaService: PrismaService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private configService: ConfigService,
    private httpIndicator: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    const rabbitmqUrl =
      this.configService.get<string>('RABBITMQ_URL') ||
      'amqp://guest:guest@localhost:5672';
    const elasticUrl =
      this.configService.get<string>('ELASTICSEARCH_URL') ||
      'http://localhost:9200';
    return this.health.check([
      () => this.prisma.pingCheck('database', this.prismaService),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () =>
        this.disk.checkStorage('disk_usage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
      () =>
        this.microservice.pingCheck('rabbitmq', {
          transport: Transport.RMQ,
          options: {
            urls: [rabbitmqUrl],
            queue: 'notifications_queue',
            queueOptions: { durable: true },
          },
        }),
      () =>
        this.httpIndicator.pingCheck('elasticsearch', elasticUrl, {
          timeout: 3000,
        }),
    ]);
  }
}
