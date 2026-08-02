import { ProductReview } from '../models/domain-models.types';
import { CreateReviewDTO, PaginationQueryDTO } from '../types/dto.types';
import { ReviewStatus } from '../enums/entity.enums';
import { Result } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface ReviewService {
  submitReview(userId: string, dto: CreateReviewDTO): Promise<Result<ProductReview, AppError>>;
  getProductReviews(productId: string, query?: PaginationQueryDTO): Promise<Result<{ items: ProductReview[]; total: number; averageRating: number }, AppError>>;
  moderateReview(reviewId: string, status: ReviewStatus): Promise<Result<ProductReview, AppError>>;
}
