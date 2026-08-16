import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { Product } from '../models/domain-models.types';
import { Result, success, failure } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface ProductRepository extends IBaseRepository<Product, string, Partial<Product>, Partial<Product>> {
  findBySlug(slug: string): Promise<Result<Product | null, AppError>>;
  findFeatured(limit?: number): Promise<Result<Product[], AppError>>;
  findWithRelations(id: string): Promise<Result<Record<string, unknown> | null, AppError>>;
}

export class SupabaseProductRepository
  extends BaseRepository<Product, string, Partial<Product>, Partial<Product>>
  implements ProductRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('products', clientOrGetter || (() => getServerClient()));
  }

  public async findBySlug(slug: string): Promise<Result<Product | null, AppError>> {
    const res = await this.findAll({ slug });
    if (!res.success) return failure(res.error);
    return success(res.value[0] || null);
  }

  public async findFeatured(limit: number = 10): Promise<Result<Product[], AppError>> {
    return this.findAll({ is_active: true, is_featured: true });
  }

  public async findWithRelations(id: string): Promise<Result<Record<string, unknown> | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*, images:product_images(*), category:categories(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findWithRelations'));
      }

      return success(data || null);
    } catch (err) {
      return failure(this.handleError(err, 'findWithRelations'));
    }
  }
}
