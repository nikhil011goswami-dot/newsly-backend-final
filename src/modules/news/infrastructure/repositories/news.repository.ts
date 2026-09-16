import { Injectable } from '@nestjs/common';
import { NewsArticle, NewsLanguage, NewsStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

import {
  CreateNewsData,
  INewsRepository,
  NewsArticleWithRelations,
  NewsFeedFilters,
  PaginatedNews,
  UpdateNewsData,
} from '../../domain/interfaces/news-repository.interface';

@Injectable()
export class NewsRepository implements INewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<NewsArticleWithRelations | null> {
    return this.prisma.newsArticle.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        translations: {
          select: {
            id: true,
            language: true,
            title: true,
            content: true,
            summary: true,
          },
        },
      },
    });
  }

  findBySlug(slug: string): Promise<NewsArticleWithRelations | null> {
    return this.prisma.newsArticle.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        translations: {
          select: {
            id: true,
            language: true,
            title: true,
            content: true,
            summary: true,
          },
        },
      },
    });
  }

  findBySlugIncludingDeleted(slug: string): Promise<NewsArticle | null> {
    return this.prisma.newsArticle.findUnique({
      where: { slug },
    });
  }

  async findFeed(filters: NewsFeedFilters): Promise<PaginatedNews> {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 10, 1), 50);
    const skip = (page - 1) * limit;

    const where: Prisma.NewsArticleWhereInput = {
      deletedAt: null,
      status: filters.status ?? NewsStatus.PUBLISHED,
      ...(filters.language ? { language: filters.language } : {}),
      ...(filters.isBreaking !== undefined
        ? { isBreaking: filters.isBreaking }
        : {}),
      ...(filters.isFeatured !== undefined
        ? { isFeatured: filters.isFeatured }
        : {}),
      ...(filters.isPremium !== undefined
        ? { isPremium: filters.isPremium }
        : {}),
      ...(filters.categorySlug
        ? {
            category: {
              slug: filters.categorySlug,
              isActive: true,
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { summary: { contains: filters.search, mode: 'insensitive' } },
              { content: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.newsArticle.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          translations: {
            select: {
              id: true,
              language: true,
              title: true,
              content: true,
              summary: true,
            },
          },
        },
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  create(data: CreateNewsData): Promise<NewsArticle> {
    return this.prisma.newsArticle.create({
      data,
    });
  }

  update(id: string, data: UpdateNewsData): Promise<NewsArticle> {
    return this.prisma.newsArticle.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.newsArticle.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.newsArticle.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }
}
