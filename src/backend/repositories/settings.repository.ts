import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { Setting } from '../models/domain-models.types';
import { Result, success, failure } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface SettingsRepository extends IBaseRepository<Setting, string, Partial<Setting>, Partial<Setting>> {
  findByKey(key: string): Promise<Result<Setting | null, AppError>>;
}

export class SupabaseSettingsRepository
  extends BaseRepository<Setting, string, Partial<Setting>, Partial<Setting>>
  implements SettingsRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('settings', clientOrGetter || (() => getServerClient()));
  }

  public async findByKey(key: string): Promise<Result<Setting | null, AppError>> {
    const res = await this.findAll({ key });
    if (!res.success) return failure(res.error);
    return success(res.value[0] || null);
  }
}
