import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
  PrismaHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { Public } from 'src/auth/decorator/public.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeHealthIndicator } from './stripe.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
    private prismaService: PrismaService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private httpIndicator: HttpHealthIndicator,
    private stripeHealth: StripeHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prisma.pingCheck('database', this.prismaService),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () =>
        this.disk.checkStorage('disk_usage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
      () => this.stripeHealth.isHealthy(),
      () =>
        this.httpIndicator.pingCheck(
          'elasticsearch',
          process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
          { timeout: 3000 },
        ),
    ]);
  }
}
