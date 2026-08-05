import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';

import configuration from '@config/configuration';
import { winstonConfig } from '@config/winston.config';

// Infrastructure
import { PrismaModule }           from '@infrastructure/database/prisma/prisma.module';
import { RedisModule }            from '@infrastructure/cache/redis.module';
import { StorageModule }          from '@infrastructure/storage/storage.module';
import { LoggingModule }          from '@infrastructure/logging/logging.module';

// Phase 1 Feature Modules
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';

// Health
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Config — load first
    ConfigModule.forRoot({
      isGlobal:   true,
      load:       [configuration],
      envFilePath: ['.env.local', '.env'],
      cache:      true,
    }),

    // Logger — load second
    WinstonModule.forRoot(winstonConfig),

    // Rate limiting — 3 named throttlers used by @Throttle() decorators
    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1000,   limit: 10  },
      { name: 'medium', ttl: 10000,  limit: 50  },
      { name: 'long',   ttl: 60000,  limit: 100 },
    ]),

    // Domain events
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Infrastructure
    PrismaModule,
    RedisModule,
    StorageModule,
    LoggingModule,

    // Phase 1 features
    AuthModule,
    UserModule,

    // Health checks
    HealthModule,
  ],
  providers: [
    // Apply rate limiting globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
