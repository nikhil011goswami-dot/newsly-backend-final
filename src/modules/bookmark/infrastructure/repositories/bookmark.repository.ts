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
      select: {
        id: true,
        userId: true,
        articleId: true,
        createdAt: true,
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            coverImageUrl: true,
            language: true,
            isPremium: true,
            isBreaking: true,
            publishedAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
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

  async findByUser(userId: string, page = 1, limit = 10) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (safePage - 1) * safeLimit;

    const where = {
      userId,
      article: {
        status: 'PUBLISHED' as const,
        deletedAt: null,
      },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.bookmark.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          createdAt: true,
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              summary: true,
              coverImageUrl: true,
              language: true,
              isPremium: true,
              isBreaking: true,
              publishedAt: true,
              viewCount: true,
              bookmarkCount: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.bookmark.count({ where }),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
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
