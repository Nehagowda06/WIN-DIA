import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { ProductImage } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface ProductImageRepository extends IBaseRepository<ProductImage, string, Partial<ProductImage>, Partial<ProductImage>> {
  findByProductId(productId: string): Promise<Result<ProductImage[], AppError>>;
  findPrimaryByProductId(productId: string): Promise<Result<ProductImage | null, AppError>>;
}

export class SupabaseProductImageRepository
  extends BaseRepository<ProductImage, string, Partial<ProductImage>, Partial<ProductImage>>
  implements ProductImageRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('product_images', clientOrGetter || (() => getServerClient()));
  }

  public async findByProductId(productId: string): Promise<Result<ProductImage[], AppError>> {
    return this.findAll({ product_id: productId });
  }

  public async findPrimaryByProductId(productId: string): Promise<Result<ProductImage | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('product_id', productId)
        .eq('is_primary', true)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findPrimaryByProductId'));
      }

      return success((data as ProductImage) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findPrimaryByProductId'));
    }
  }
}
