import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class BookmarkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, articleId: string) {
    return this.prisma.bookmark.create({
      data: {
        userId,
        articleId,
      },
      include: {
        article: true,
      },
    });
  }

  async findByUserAndArticle(userId: string, articleId: string) {
    return this.prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.bookmark.findMany({
      where: { userId },
      include: { article: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(userId: string, articleId: string) {
    return this.prisma.bookmark.delete({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });
  }
}
