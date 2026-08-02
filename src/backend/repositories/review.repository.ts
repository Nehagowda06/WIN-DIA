import { BaseRepository, IBaseRepository } from './base.repository';
import { ProductReview } from '../models/domain-models.types';
import { CreateReviewDTO } from '../types/dto.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface ProductReviewRepository extends IBaseRepository<ProductReview, string, CreateReviewDTO, Partial<ProductReview>> {
  findByProductId(productId: string): Promise<Result<ProductReview[], AppError>>;
  findByUserId(userId: string): Promise<Result<ProductReview[], AppError>>;
}

export class SupabaseProductReviewRepository
  extends BaseRepository<ProductReview, string, CreateReviewDTO, Partial<ProductReview>>
  implements ProductReviewRepository {
  constructor() {
    super('product_reviews');
  }

  public async findByProductId(productId: string): Promise<Result<ProductReview[], AppError>> {
    return this.findAll({ product_id: productId });
  }

  public async findByUserId(userId: string): Promise<Result<ProductReview[], AppError>> {
    return this.findAll({ user_id: userId });
  }
}
