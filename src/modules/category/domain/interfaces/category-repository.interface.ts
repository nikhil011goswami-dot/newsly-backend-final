import { Category, CategoryTranslation } from '@prisma/client';

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryWithRelations extends Category {
  children?: Category[];
  translations?: CategoryTranslation[];
}

export interface ICategoryRepository {
  findAllActive(): Promise<CategoryWithRelations[]>;
  findBySlug(slug: string): Promise<CategoryWithRelations | null>;
  findById(id: string): Promise<CategoryWithRelations | null>;
  findBySlugIncludingInactive(slug: string): Promise<Category | null>;
  create(data: CreateCategoryData): Promise<Category>;
  update(id: string, data: UpdateCategoryData): Promise<Category>;
  delete(id: string): Promise<void>;
}
