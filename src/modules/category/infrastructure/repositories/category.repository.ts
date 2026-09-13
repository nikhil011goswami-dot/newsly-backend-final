import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import {
  ICategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
  CategoryWithRelations,
} from '../../domain/interfaces/category-repository.interface';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive(): Promise<CategoryWithRelations[]> {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        translations: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findBySlug(slug: string): Promise<CategoryWithRelations | null> {
    return this.prisma.category.findFirst({
      where: { slug, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        translations: true,
      },
    });
  }

  findById(id: string): Promise<CategoryWithRelations | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        translations: true,
      },
    });
  }

  findBySlugIncludingInactive(slug: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { slug },
    });
  }

  create(data: CreateCategoryData): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: UpdateCategoryData): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
