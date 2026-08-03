import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { ProductReview } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface ProductReviewRepository extends IBaseRepository<ProductReview, string, Partial<ProductReview>, Partial<ProductReview>> {
  findByProductId(productId: string): Promise<Result<ProductReview[], AppError>>;
  findByUserId(userId: string): Promise<Result<ProductReview[], AppError>>;
}

export class SupabaseProductReviewRepository
  extends BaseRepository<ProductReview, string, Partial<ProductReview>, Partial<ProductReview>>
  implements ProductReviewRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('product_reviews', clientOrGetter || (() => getServerClient()));
  }

  public async findByProductId(productId: string): Promise<Result<ProductReview[], AppError>> {
    return this.findAll({ product_id: productId });
  }

  public async findByUserId(userId: string): Promise<Result<ProductReview[], AppError>> {
    return this.findAll({ user_id: userId });
  }
}
