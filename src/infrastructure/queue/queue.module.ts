import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '@common/constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host:     configService.get<string>('bull.redis.host', 'localhost'),
          port:     configService.get<number>('bull.redis.port', 6379),
          password: configService.get<string>('bull.redis.password') || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail:     50,
          attempts:         3,
          backoff:          { type: 'exponential', delay: 2000 },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.NOTIFICATION  },
      { name: QUEUE_NAMES.AI_PROCESSING },
      { name: QUEUE_NAMES.ANALYTICS     },
      { name: QUEUE_NAMES.TRANSLATION   },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
