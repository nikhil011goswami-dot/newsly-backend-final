import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { RedisModule }  from '@infrastructure/cache/redis.module';

import {
  HealthController,
  DatabaseHealthIndicator,
  RedisHealthIndicator,
} from './health.controller';

@Module({
  imports:     [TerminusModule, PrismaModule, RedisModule],
  controllers: [HealthController],
  providers:   [DatabaseHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
