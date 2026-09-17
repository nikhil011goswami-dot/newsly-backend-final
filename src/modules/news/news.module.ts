import { Module } from '@nestjs/common';

import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { RedisModule } from '@infrastructure/cache/redis.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';

import { NewsController } from './presentation/controllers/news.controller';
import { NewsService } from './application/services/news.service';
import { NewsRepository } from './infrastructure/repositories/news.repository';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    UserModule,
  ],
  controllers: [NewsController],
  providers: [
    NewsService,
    NewsRepository,
  ],
  exports: [
    NewsService,
    NewsRepository,
  ],
})
export class NewsModule {}
