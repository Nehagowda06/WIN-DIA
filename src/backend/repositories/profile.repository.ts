import { BaseRepository, IBaseRepository } from './base.repository';
import { Profile } from '../models/domain-models.types';
import { UpdateProfileDTO } from '../types/dto.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface ProfileRepository extends IBaseRepository<Profile, string, Partial<Profile>, UpdateProfileDTO> {
  findByEmail(email: string): Promise<Result<Profile | null, AppError>>;
  findByPhone(phone: string): Promise<Result<Profile | null, AppError>>;
}

export class SupabaseProfileRepository
  extends BaseRepository<Profile, string, Partial<Profile>, UpdateProfileDTO>
  implements ProfileRepository {
  constructor() {
    super('profiles');
  }

  public async findByEmail(email: string): Promise<Result<Profile | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findByEmail'));
      }

      return success((data as Profile) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findByEmail'));
    }
  }

  public async findByPhone(phone: string): Promise<Result<Profile | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findByPhone'));
      }

      return success((data as Profile) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findByPhone'));
    }
  }
}
