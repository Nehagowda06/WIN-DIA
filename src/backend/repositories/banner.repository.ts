import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { Banner } from '../models/domain-models.types';
import { Result, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface BannerRepository extends IBaseRepository<Banner, string, Partial<Banner>, Partial<Banner>> {
  findActive(): Promise<Result<Banner[], AppError>>;
}

export class SupabaseBannerRepository
  extends BaseRepository<Banner, string, Partial<Banner>, Partial<Banner>>
  implements BannerRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('banners', clientOrGetter || (() => getServerClient()));
  }

  public async findActive(): Promise<Result<Banner[], AppError>> {
    return this.findAll({ is_active: true });
  }
}
