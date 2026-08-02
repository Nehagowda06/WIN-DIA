import { BaseRepository, IBaseRepository } from './base.repository';
import { Coupon } from '../models/domain-models.types';
import { CreateCouponDTO } from '../types/dto.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface CouponRepository extends IBaseRepository<Coupon, string, CreateCouponDTO, Partial<Coupon>> {
  findByCode(code: string): Promise<Result<Coupon | null, AppError>>;
}

export class SupabaseCouponRepository
  extends BaseRepository<Coupon, string, CreateCouponDTO, Partial<Coupon>>
  implements CouponRepository {
  constructor() {
    super('coupons');
  }

  public async findByCode(code: string): Promise<Result<Coupon | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('code', code.toUpperCase())
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findByCode'));
      }

      return success((data as Coupon) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findByCode'));
    }
  }
}
