import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '@prisma/client';
import { RedisService } from '@infrastructure/cache/redis.service';
import { CACHE_KEYS } from '@common/constants';
import { CategoryRepository } from '../../infrastructure/repositories/category.repository';
import {
  CreateCategoryData,
  UpdateCategoryData,
  CategoryWithRelations,
} from '../../domain/interfaces/category-repository.interface';

@Injectable()
export class CategoryService {
  private readonly cacheTtl = 300;

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly redisService: RedisService,
  ) {}

  async getAll(): Promise<CategoryWithRelations[]> {
    const cached = await this.redisService.get<CategoryWithRelations[]>(
      CACHE_KEYS.CATEGORIES,
    );

    if (cached) return cached;

    const categories = await this.categoryRepository.findAllActive();

    await this.redisService.set(
      CACHE_KEYS.CATEGORIES,
      categories,
      this.cacheTtl,
    );

    return categories;
  }

  async getBySlug(slug: string): Promise<CategoryWithRelations> {
    const category = await this.categoryRepository.findBySlug(slug);

    if (!category) {
      throw new NotFoundException(`Category '${slug}' not found`);
    }

    return category;
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const existing = await this.categoryRepository.findBySlugIncludingInactive(
      data.slug,
    );

    if (existing) {
      throw new ConflictException('Category slug is already in use');
    }

    if (data.parentId) {
      const parent = await this.categoryRepository.findById(data.parentId);

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = await this.categoryRepository.create(data);

    await this.redisService.del(CACHE_KEYS.CATEGORIES);

    return category;
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const existing = await this.categoryRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugConflict =
        await this.categoryRepository.findBySlugIncludingInactive(data.slug);

      if (slugConflict && slugConflict.id !== id) {
        throw new ConflictException('Category slug is already in use');
      }
    }

    if (data.parentId) {
      if (data.parentId === id) {
        throw new ConflictException(
          'A category cannot be its own parent',
        );
      }

      const parent = await this.categoryRepository.findById(data.parentId);

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = await this.categoryRepository.update(id, data);

    await this.redisService.del(CACHE_KEYS.CATEGORIES);

    return category;
  }

  async delete(id: string): Promise<{ message: string }> {
    const existing = await this.categoryRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.delete(id);
    await this.redisService.del(CACHE_KEYS.CATEGORIES);

    return { message: 'Category deleted successfully.' };
  }
}
