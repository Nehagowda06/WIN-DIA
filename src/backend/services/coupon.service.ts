import { Coupon } from '../models/domain-models.types';
import { ApplyCouponDTO, CreateCouponDTO } from '../types/dto.types';
import { Result } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface CouponService {
  validateAndApplyCoupon(dto: ApplyCouponDTO): Promise<Result<{ coupon: Coupon; discountAmount: number; finalTotal: number }, AppError>>;
  createCoupon(dto: CreateCouponDTO): Promise<Result<Coupon, AppError>>;
  getCouponByCode(code: string): Promise<Result<Coupon, AppError>>;
}
