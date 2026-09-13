import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NewsArticle, NewsLanguage, NewsStatus } from '@prisma/client';

import { RedisService } from '@infrastructure/cache/redis.service';
import { CACHE_KEYS } from '@common/constants';

import { NewsRepository } from '../../infrastructure/repositories/news.repository';
import {
  CreateNewsData,
  NewsArticleWithRelations,
  NewsFeedFilters,
  PaginatedNews,
  UpdateNewsData,
} from '../../domain/interfaces/news-repository.interface';

@Injectable()
export class NewsService {
  private readonly cacheTtl = 300;

  constructor(
    private readonly newsRepository: NewsRepository,
    private readonly redisService: RedisService,
  ) {}

  private feedCacheKey(filters: NewsFeedFilters): string {
    return `${CACHE_KEYS.NEWS_FEED}:${JSON.stringify({
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      categorySlug: filters.categorySlug ?? null,
      language: filters.language ?? null,
      status: filters.status ?? null,
      isBreaking: filters.isBreaking ?? null,
      isFeatured: filters.isFeatured ?? null,
      isPremium: filters.isPremium ?? null,
    })}`;
  }

  private articleCacheKey(slug: string): string {
    return `${CACHE_KEYS.NEWS_ARTICLE}:${slug}`;
  }

  async getFeed(filters: NewsFeedFilters): Promise<PaginatedNews> {
    const cacheKey = this.feedCacheKey(filters);

    const cached = await this.redisService.get<PaginatedNews>(cacheKey);
    if (cached) return cached;

    const result = await this.newsRepository.findFeed(filters);

    await this.redisService.set(cacheKey, result, this.cacheTtl);

    return result;
  }

  async getBySlug(slug: string): Promise<NewsArticleWithRelations> {
    const cacheKey = this.articleCacheKey(slug);

    const cached =
      await this.redisService.get<NewsArticleWithRelations>(cacheKey);

    if (cached) return cached;

    const article = await this.newsRepository.findBySlug(slug);

    if (!article || article.status !== NewsStatus.PUBLISHED) {
      throw new NotFoundException(`News article '${slug}' not found`);
    }

    await this.redisService.set(cacheKey, article, this.cacheTtl);

    return article;
  }

  async getById(id: string): Promise<NewsArticleWithRelations> {
    const article = await this.newsRepository.findById(id);

    if (!article || article.status !== NewsStatus.PUBLISHED) {
      throw new NotFoundException('News article not found');
    }

    return article;
  }

  async create(data: CreateNewsData): Promise<NewsArticle> {
    const existing = await this.newsRepository.findBySlugIncludingDeleted(
      data.slug,
    );

    if (existing) {
      throw new ConflictException('News article slug is already in use');
    }

    const createData = {
      ...data,
      ...(data.status === NewsStatus.PUBLISHED && !data.publishedAt
        ? { publishedAt: new Date() }
        : {}),
    };

    const article = await this.newsRepository.create(createData);

    await this.redisService.delByPattern(`${CACHE_KEYS.NEWS_FEED}:*`);

    return article;
  }

  async update(id: string, data: UpdateNewsData): Promise<NewsArticle> {
    const existing = await this.newsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('News article not found');
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugConflict =
        await this.newsRepository.findBySlugIncludingDeleted(data.slug);

      if (slugConflict && slugConflict.id !== id) {
        throw new ConflictException('News article slug is already in use');
      }
    }

    const article = await this.newsRepository.update(id, data);

    await this.redisService.delByPattern(`${CACHE_KEYS.NEWS_FEED}:*`);
    await this.redisService.del(this.articleCacheKey(existing.slug));

    if (data.slug && data.slug !== existing.slug) {
      await this.redisService.del(this.articleCacheKey(data.slug));
    }

    return article;
  }

  async delete(id: string): Promise<{ message: string }> {
    const existing = await this.newsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('News article not found');
    }

    await this.newsRepository.softDelete(id);

    await this.redisService.delByPattern(`${CACHE_KEYS.NEWS_FEED}:*`);
    await this.redisService.del(this.articleCacheKey(existing.slug));

    return { message: 'News article deleted successfully.' };
  }

  async incrementViewCount(id: string): Promise<{ message: string }> {
    const existing = await this.newsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('News article not found');
    }

    await this.newsRepository.incrementViewCount(id);

    await this.redisService.del(this.articleCacheKey(existing.slug));
    await this.redisService.delByPattern(`${CACHE_KEYS.NEWS_FEED}:*`);

    return { message: 'View count incremented successfully.' };
  }
}
