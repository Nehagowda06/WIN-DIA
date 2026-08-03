import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { Address } from '../models/domain-models.types';
import { CreateAddressDTO } from '../types/dto.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface AddressRepository extends IBaseRepository<Address, string, CreateAddressDTO, Partial<CreateAddressDTO>> {
  findByUserId(userId: string): Promise<Result<Address[], AppError>>;
  findDefaultByUserId(userId: string): Promise<Result<Address | null, AppError>>;
}

export class SupabaseAddressRepository
  extends BaseRepository<Address, string, CreateAddressDTO, Partial<CreateAddressDTO>>
  implements AddressRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('addresses', clientOrGetter || (() => getServerClient()));
  }

  public async findByUserId(userId: string): Promise<Result<Address[], AppError>> {
    return this.findAll({ user_id: userId });
  }

  public async findDefaultByUserId(userId: string): Promise<Result<Address | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findDefaultByUserId'));
      }

      return success((data as Address) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findDefaultByUserId'));
    }
  }
}
