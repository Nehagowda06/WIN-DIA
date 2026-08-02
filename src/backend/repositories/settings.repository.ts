import { BaseRepository, IBaseRepository } from './base.repository';
import { Setting } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface SettingsRepository extends IBaseRepository<Setting, string, Partial<Setting>, Partial<Setting>> {
  findByKey(key: string): Promise<Result<Setting | null, AppError>>;
}

export class SupabaseSettingsRepository
  extends BaseRepository<Setting, string, Partial<Setting>, Partial<Setting>>
  implements SettingsRepository {
  constructor() {
    super('settings');
  }

  public async findByKey(key: string): Promise<Result<Setting | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('key', key)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findByKey'));
      }

      return success((data as Setting) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findByKey'));
    }
  }
}
