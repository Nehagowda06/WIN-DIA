import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { Cart } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface CartRepository extends IBaseRepository<Cart, string, Partial<Cart>, Partial<Cart>> {
  findByUserId(userId: string): Promise<Result<Cart | null, AppError>>;
  findActiveByUserId(userId: string): Promise<Result<Cart | null, AppError>>;
  findBySessionId(sessionId: string): Promise<Result<Cart | null, AppError>>;
}

export class SupabaseCartRepository
  extends BaseRepository<Cart, string, Partial<Cart>, Partial<Cart>>
  implements CartRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('carts', clientOrGetter || (() => getServerClient()));
  }

  public async findByUserId(userId: string): Promise<Result<Cart | null, AppError>> {
    return this.findActiveByUserId(userId);
  }

  public async findActiveByUserId(userId: string): Promise<Result<Cart | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findActiveByUserId'));
      }

      return success((data as Cart) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findActiveByUserId'));
    }
  }

  public async findBySessionId(sessionId: string): Promise<Result<Cart | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findBySessionId'));
      }

      return success((data as Cart) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findBySessionId'));
    }
  }
}
