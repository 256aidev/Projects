import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import * as os from 'os';

const APP_VERSION = '1.0.0';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
  ) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
    };
  }

  @Get('detailed')
  @HealthCheck()
  async detailed() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    let dbStatus = 'healthy';
    try {
      await this.db.isHealthy('database');
    } catch {
      dbStatus = 'unhealthy';
    }

    return {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      version: APP_VERSION,
      uptime_seconds: uptimeSeconds,
      database: dbStatus,
      memory: {
        total_bytes: os.totalmem(),
        free_bytes: os.freemem(),
        usage_percent: Math.round(
          ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        ),
      },
      hostname: os.hostname(),
      node_version: process.version,
      timestamp: new Date().toISOString(),
    };
  }
}
