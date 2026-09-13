import { Module } from '@nestjs/common';

import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { RedisModule } from '@infrastructure/cache/redis.module';
import { AuthModule } from '@modules/auth/auth.module';

import { CategoryController } from './presentation/controllers/category.controller';
import { CategoryService } from './application/services/category.service';
import { CategoryRepository } from './infrastructure/repositories/category.repository';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
  ],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    CategoryRepository,
  ],
  exports: [
    CategoryService,
    CategoryRepository,
  ],
})
export class CategoryModule {}
