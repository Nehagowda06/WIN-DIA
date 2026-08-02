import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError, ValidationError } from '../errors/domain-errors';
import { ProductReview } from '../models/domain-models.types';
import { CreateReviewDTO, PaginationQueryDTO } from '../types/dto.types';
import { ReviewStatus } from '../enums/entity.enums';
import { ProductReviewRepository } from '../repositories/review.repository';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface ReviewService {
  submitReview(userId: string, dto: CreateReviewDTO): Promise<Result<ProductReview, AppError>>;
  updateReview(reviewId: string, userId: string, dto: Partial<CreateReviewDTO>): Promise<Result<ProductReview, AppError>>;
  deleteReview(reviewId: string, userId: string): Promise<Result<boolean, AppError>>;
  approveReview(reviewId: string): Promise<Result<ProductReview, AppError>>;
  rejectReview(reviewId: string): Promise<Result<ProductReview, AppError>>;
  getProductReviews(productId: string, query?: PaginationQueryDTO): Promise<Result<{ items: ProductReview[]; total: number; averageRating: number }, AppError>>;
}

export class ReviewServiceImpl implements ReviewService {
  private reviewRepo: ProductReviewRepository;

  constructor(reviewRepo?: ProductReviewRepository) {
    this.reviewRepo = reviewRepo || container.resolve<ProductReviewRepository>(RepositoryTokens.ProductReviewRepository);
  }

  public async submitReview(userId: string, dto: CreateReviewDTO): Promise<Result<ProductReview, AppError>> {
    logger.info(`[ReviewService.submitReview] User ${userId} submitting review for product ${dto.product_id}`);
    if (dto.rating < 1 || dto.rating > 5) {
      return failure(new ValidationError('Rating must be an integer between 1 and 5'));
    }

    return this.reviewRepo.create({
      product_id: dto.product_id,
      user_id: userId,
      rating: dto.rating,
      title: dto.title || null,
      comment: dto.comment || null,
      status: ReviewStatus.PENDING,
    } as any);
  }

  public async updateReview(reviewId: string, userId: string, dto: Partial<CreateReviewDTO>): Promise<Result<ProductReview, AppError>> {
    const existing = await this.reviewRepo.findById(reviewId);
    if (!existing.success) return existing;
    if (!existing.value || existing.value.user_id !== userId) {
      return failure(new NotFoundError('Review not found or permission denied'));
    }

    return this.reviewRepo.update(reviewId, {
      ...dto,
      status: ReviewStatus.PENDING,
    } as any);
  }

  public async deleteReview(reviewId: string, userId: string): Promise<Result<boolean, AppError>> {
    const existing = await this.reviewRepo.findById(reviewId);
    if (!existing.success) return failure(existing.error);
    if (!existing.value || existing.value.user_id !== userId) {
      return failure(new NotFoundError('Review not found or permission denied'));
    }

    return this.reviewRepo.delete(reviewId);
  }

  public async approveReview(reviewId: string): Promise<Result<ProductReview, AppError>> {
    logger.info(`[ReviewService.approveReview] Approving review ${reviewId}`);
    return this.reviewRepo.update(reviewId, { status: ReviewStatus.APPROVED });
  }

  public async rejectReview(reviewId: string): Promise<Result<ProductReview, AppError>> {
    logger.info(`[ReviewService.rejectReview] Rejecting review ${reviewId}`);
    return this.reviewRepo.update(reviewId, { status: ReviewStatus.REJECTED });
  }

  public async getProductReviews(productId: string, query?: PaginationQueryDTO): Promise<Result<{ items: ProductReview[]; total: number; averageRating: number }, AppError>> {
    const reviewsRes = await this.reviewRepo.findByProductId(productId);
    if (!reviewsRes.success) return failure(reviewsRes.error);

    const approved = reviewsRes.value.filter((r) => r.status === ReviewStatus.APPROVED);
    const total = approved.length;
    const sum = approved.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

    return success({
      items: approved,
      total,
      averageRating,
    });
  }
}
