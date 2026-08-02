import { BaseRepository, IBaseRepository } from './base.repository';
import { Category } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface CategoryRepository extends IBaseRepository<Category, string, Partial<Category>, Partial<Category>> {
  findBySlug(slug: string): Promise<Result<Category | null, AppError>>;
  findRoots(): Promise<Result<Category[], AppError>>;
}

export class SupabaseCategoryRepository
  extends BaseRepository<Category, string, Partial<Category>, Partial<Category>>
  implements CategoryRepository {
  constructor() {
    super('categories');
  }

  public async findBySlug(slug: string): Promise<Result<Category | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findBySlug'));
      }

      return success((data as Category) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findBySlug'));
    }
  }

  public async findRoots(): Promise<Result<Category[], AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .is('parent_id', null);

      if (error) {
        return failure(this.handleError(error, 'findRoots'));
      }

      return success((data as Category[]) || []);
    } catch (err) {
      return failure(this.handleError(err, 'findRoots'));
    }
  }
}
