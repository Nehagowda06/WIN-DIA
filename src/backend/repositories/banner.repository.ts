import { BaseRepository, IBaseRepository } from './base.repository';
import { Banner } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface BannerRepository extends IBaseRepository<Banner, string, Partial<Banner>, Partial<Banner>> {
  findActive(): Promise<Result<Banner[], AppError>>;
}

export class SupabaseBannerRepository
  extends BaseRepository<Banner, string, Partial<Banner>, Partial<Banner>>
  implements BannerRepository {
  constructor() {
    super('banners');
  }

  public async findActive(): Promise<Result<Banner[], AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        return failure(this.handleError(error, 'findActive'));
      }

      return success((data as Banner[]) || []);
    } catch (err) {
      return failure(this.handleError(err, 'findActive'));
    }
  }
}
