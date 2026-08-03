import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { ProductVariant } from '../models/domain-models.types';
import { Result, success, failure } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface ProductVariantRepository extends IBaseRepository<ProductVariant, string, Partial<ProductVariant>, Partial<ProductVariant>> {
  findByProductId(productId: string): Promise<Result<ProductVariant[], AppError>>;
  findBySku(sku: string): Promise<Result<ProductVariant | null, AppError>>;
}

export class SupabaseProductVariantRepository
  extends BaseRepository<ProductVariant, string, Partial<ProductVariant>, Partial<ProductVariant>>
  implements ProductVariantRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('product_variants', clientOrGetter || (() => getServerClient()));
  }

  public async findByProductId(productId: string): Promise<Result<ProductVariant[], AppError>> {
    return this.findAll({ product_id: productId });
  }

  public async findBySku(sku: string): Promise<Result<ProductVariant | null, AppError>> {
    const res = await this.findAll({ sku });
    if (!res.success) return failure(res.error);
    return success(res.value[0] || null);
  }
}
