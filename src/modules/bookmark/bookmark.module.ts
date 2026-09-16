import { Module } from '@nestjs/common';

import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';

import { BookmarkController } from './presentation/controllers/bookmark.controller';
import { BookmarkService } from './application/services/bookmark.service';
import { BookmarkRepository } from './infrastructure/repositories/bookmark.repository';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [BookmarkController],
  providers: [
    BookmarkService,
    BookmarkRepository,
  ],
  exports: [
    BookmarkService,
    BookmarkRepository,
  ],
})
export class BookmarkModule {}
