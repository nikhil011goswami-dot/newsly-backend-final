import { NewsArticle, NewsLanguage, NewsStatus } from '@prisma/client';

export interface CreateNewsData {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  coverImageUrl?: string;
  coverImageKey?: string;
  source?: string;
  sourceUrl?: string;
  language?: NewsLanguage;
  status?: NewsStatus;
  isBreaking?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  tags?: string[];
  aiTags?: string[];
  readingTimeMinutes?: number;
  publishedAt?: Date;
  scheduledAt?: Date;
  authorId: string;
  categoryId: string;
}

export interface UpdateNewsData {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  coverImageUrl?: string;
  coverImageKey?: string;
  source?: string;
  sourceUrl?: string;
  language?: NewsLanguage;
  status?: NewsStatus;
  isBreaking?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  tags?: string[];
  aiTags?: string[];
  readingTimeMinutes?: number;
  publishedAt?: Date | null;
  scheduledAt?: Date | null;
  categoryId?: string;
}

export interface NewsArticleWithRelations extends NewsArticle {
  author?: {
    id: string;
    fullName: string | null;
    username: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  translations?: {
    id: string;
    language: NewsLanguage;
    title: string;
    content: string;
    summary: string | null;
  }[];
}

export interface NewsFeedFilters {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  language?: NewsLanguage;
  status?: NewsStatus;
  isBreaking?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
}

export interface PaginatedNews {
  items: NewsArticleWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface INewsRepository {
  findById(id: string): Promise<NewsArticleWithRelations | null>;
  findBySlug(slug: string): Promise<NewsArticleWithRelations | null>;
  findBySlugIncludingDeleted(slug: string): Promise<NewsArticle | null>;

  findFeed(filters: NewsFeedFilters): Promise<PaginatedNews>;

  create(data: CreateNewsData): Promise<NewsArticle>;
  update(id: string, data: UpdateNewsData): Promise<NewsArticle>;
  softDelete(id: string): Promise<void>;

  incrementViewCount(id: string): Promise<void>;
}
