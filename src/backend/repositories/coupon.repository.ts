import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { Coupon } from '../models/domain-models.types';
import { Result, success, failure } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface CouponRepository extends IBaseRepository<Coupon, string, Partial<Coupon>, Partial<Coupon>> {
  findByCode(code: string): Promise<Result<Coupon | null, AppError>>;
}

export class SupabaseCouponRepository
  extends BaseRepository<Coupon, string, Partial<Coupon>, Partial<Coupon>>
  implements CouponRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('coupons', clientOrGetter || (() => getServerClient()));
  }

  public async findByCode(code: string): Promise<Result<Coupon | null, AppError>> {
    const res = await this.findAll({ code });
    if (!res.success) return failure(res.error);
    return success(res.value[0] || null);
  }
}
