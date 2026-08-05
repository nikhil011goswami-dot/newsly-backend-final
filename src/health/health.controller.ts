import { Controller, Get, Injectable } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { RedisService }  from '@infrastructure/cache/redis.service';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch {
      return this.getStatus(key, false, { message: 'Database connection failed' });
    }
  }
}

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.ping();
      return this.getStatus(key, pong === 'PONG', { pong });
    } catch {
      return this.getStatus(key, false, { message: 'Redis connection failed' });
    }
  }
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health:      HealthCheckService,
    private readonly dbHealth:    DatabaseHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check service health (DB + Redis)' })
  check() {
    return this.health.check([
      () => this.dbHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
