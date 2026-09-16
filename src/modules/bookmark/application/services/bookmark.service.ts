import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BookmarkRepository } from '../../infrastructure/repositories/bookmark.repository';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class BookmarkService {
  constructor(
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly prisma: PrismaService,
  ) {}

  async addBookmark(userId: string, articleId: string) {
    const article = await this.prisma.newsArticle.findFirst({
      where: {
        id: articleId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    if (!article) {
      throw new NotFoundException('Published article not found');
    }

    const existing = await this.bookmarkRepository.findByUserAndArticle(
      userId,
      articleId,
    );

    if (existing) {
      throw new ConflictException('Article already bookmarked');
    }

    const bookmark = await this.bookmarkRepository.create(userId, articleId);

    await this.prisma.newsArticle.update({
      where: { id: articleId },
      data: {
        bookmarkCount: {
          increment: 1,
        },
      },
    });

    return bookmark;
  }

  async removeBookmark(userId: string, articleId: string) {
    const existing = await this.bookmarkRepository.findByUserAndArticle(
      userId,
      articleId,
    );

    if (!existing) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarkRepository.delete(userId, articleId);

    await this.prisma.newsArticle.update({
      where: { id: articleId },
      data: {
        bookmarkCount: {
          decrement: 1,
        },
      },
    });

    return {
      message: 'Bookmark removed successfully',
    };
  }

  async getMyBookmarks(userId: string) {
    return this.bookmarkRepository.findByUser(userId);
  }

  async isBookmarked(userId: string, articleId: string) {
    const bookmark = await this.bookmarkRepository.findByUserAndArticle(
      userId,
      articleId,
    );

    return {
      isBookmarked: Boolean(bookmark),
    };
  }
}
