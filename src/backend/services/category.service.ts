import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError } from '../errors/domain-errors';
import { Category } from '../models/domain-models.types';
import { CategoryRepository } from '../repositories/category.repository';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface CategoryService {
  getCategoryById(id: string): Promise<Result<Category, AppError>>;
  getCategoryBySlug(slug: string): Promise<Result<Category, AppError>>;
  getRootCategories(): Promise<Result<Category[], AppError>>;
  listCategories(): Promise<Result<Category[], AppError>>;
}

export class CategoryServiceImpl implements CategoryService {
  private categoryRepo: CategoryRepository;

  constructor(categoryRepo?: CategoryRepository) {
    this.categoryRepo = categoryRepo || container.resolve<CategoryRepository>(RepositoryTokens.CategoryRepository);
  }

  public async getCategoryById(id: string): Promise<Result<Category, AppError>> {
    const res = await this.categoryRepo.findById(id);
    if (!res.success) return res;
    if (!res.value) {
      return failure(new NotFoundError(`Category not found with ID ${id}`));
    }
    return success(res.value);
  }

  public async getCategoryBySlug(slug: string): Promise<Result<Category, AppError>> {
    const res = await this.categoryRepo.findBySlug(slug);
    if (!res.success) return res;
    if (!res.value) {
      return failure(new NotFoundError(`Category not found with slug ${slug}`));
    }
    return success(res.value);
  }

  public async getRootCategories(): Promise<Result<Category[], AppError>> {
    return this.categoryRepo.findRoots();
  }

  public async listCategories(): Promise<Result<Category[], AppError>> {
    return this.categoryRepo.findAll({ is_active: true });
  }
}
