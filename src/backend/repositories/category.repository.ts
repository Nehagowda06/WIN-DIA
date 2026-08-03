import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { Category } from '../models/domain-models.types';
import { Result, success, failure } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface CategoryRepository extends IBaseRepository<Category, string, Partial<Category>, Partial<Category>> {
  findBySlug(slug: string): Promise<Result<Category | null, AppError>>;
  findActive(): Promise<Result<Category[], AppError>>;
  findRoots(): Promise<Result<Category[], AppError>>;
}

export class SupabaseCategoryRepository
  extends BaseRepository<Category, string, Partial<Category>, Partial<Category>>
  implements CategoryRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('categories', clientOrGetter || (() => getServerClient()));
  }

  public async findBySlug(slug: string): Promise<Result<Category | null, AppError>> {
    const res = await this.findAll({ slug });
    if (!res.success) return failure(res.error);
    return success(res.value[0] || null);
  }

  public async findActive(): Promise<Result<Category[], AppError>> {
    return this.findAll({ is_active: true });
  }

  public async findRoots(): Promise<Result<Category[], AppError>> {
    return this.findAll({ parent_id: null });
  }
}
