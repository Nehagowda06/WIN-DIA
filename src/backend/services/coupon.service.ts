import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError, ValidationError } from '../errors/domain-errors';
import { Coupon } from '../models/domain-models.types';
import { ApplyCouponDTO, CreateCouponDTO } from '../types/dto.types';
import { CouponRepository } from '../repositories/coupon.repository';
import { CouponType } from '../enums/entity.enums';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface CouponCalculationResult {
  coupon: Coupon;
  discountAmount: number;
  finalTotal: number;
}

export interface CouponService {
  validateCoupon(code: string, cartTotal: number): Promise<Result<Coupon, AppError>>;
  calculateDiscount(dto: ApplyCouponDTO): Promise<Result<CouponCalculationResult, AppError>>;
  createCoupon(dto: CreateCouponDTO): Promise<Result<Coupon, AppError>>;
  getCouponByCode(code: string): Promise<Result<Coupon, AppError>>;
  incrementUsage(couponId: string): Promise<Result<Coupon, AppError>>;
}

export class CouponServiceImpl implements CouponService {
  private couponRepo: CouponRepository;

  constructor(couponRepo?: CouponRepository) {
    this.couponRepo = couponRepo || container.resolve<CouponRepository>(RepositoryTokens.CouponRepository);
  }

  public async validateCoupon(code: string, cartTotal: number): Promise<Result<Coupon, AppError>> {
    logger.info(`[CouponService.validateCoupon] Validating coupon ${code} for total ${cartTotal}`);
    const couponRes = await this.couponRepo.findByCode(code);
    if (!couponRes.success) return couponRes;

    const coupon = couponRes.value;
    if (!coupon || !coupon.is_active) {
      return failure(new NotFoundError(`Coupon code "${code}" is invalid or inactive`));
    }

    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return failure(new ValidationError(`Coupon code "${code}" is not active yet`));
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return failure(new ValidationError(`Coupon code "${code}" has expired`));
    }

    if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.used_count >= coupon.usage_limit) {
      return failure(new ValidationError(`Coupon code "${code}" has reached its maximum usage limit`));
    }

    if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) {
      return failure(new ValidationError(`Minimum order amount of ₹${coupon.min_order_amount} required to use coupon "${code}"`));
    }

    return success(coupon);
  }

  public async calculateDiscount(dto: ApplyCouponDTO): Promise<Result<CouponCalculationResult, AppError>> {
    const validRes = await this.validateCoupon(dto.code, dto.cart_total);
    if (!validRes.success) return failure(validRes.error);

    const coupon = validRes.value;
    let discountAmount = 0;

    if (coupon.discount_type === CouponType.PERCENTAGE) {
      discountAmount = (dto.cart_total * coupon.discount_value) / 100;
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
      }
    } else {
      discountAmount = Math.min(coupon.discount_value, dto.cart_total);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalTotal = Math.max(0, Math.round((dto.cart_total - discountAmount) * 100) / 100);

    return success({
      coupon,
      discountAmount,
      finalTotal,
    });
  }

  public async createCoupon(dto: CreateCouponDTO): Promise<Result<Coupon, AppError>> {
    return this.couponRepo.create(dto);
  }

  public async getCouponByCode(code: string): Promise<Result<Coupon, AppError>> {
    const couponRes = await this.couponRepo.findByCode(code);
    if (!couponRes.success) return couponRes;
    if (!couponRes.value) {
      return failure(new NotFoundError(`Coupon code "${code}" not found`));
    }
    return success(couponRes.value);
  }

  public async incrementUsage(couponId: string): Promise<Result<Coupon, AppError>> {
    const couponRes = await this.couponRepo.findById(couponId);
    if (!couponRes.success) return couponRes;
    if (!couponRes.value) {
      return failure(new NotFoundError(`Coupon ID ${couponId} not found`));
    }

    return this.couponRepo.update(couponId, { used_count: couponRes.value.used_count + 1 });
  }
}
