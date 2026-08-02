import { BaseRepository, IBaseRepository } from './base.repository';
import { Cart } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface CartRepository extends IBaseRepository<Cart, string, Partial<Cart>, Partial<Cart>> {
  findByUserId(userId: string): Promise<Result<Cart | null, AppError>>;
  findBySessionId(sessionId: string): Promise<Result<Cart | null, AppError>>;
  findWithItems(cartId: string): Promise<Result<Record<string, unknown> | null, AppError>>;
}

export class SupabaseCartRepository
  extends BaseRepository<Cart, string, Partial<Cart>, Partial<Cart>>
  implements CartRepository {
  constructor() {
    super('carts');
  }

  public async findByUserId(userId: string): Promise<Result<Cart | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findByUserId'));
      }

      return success((data as Cart) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findByUserId'));
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

  public async findWithItems(cartId: string): Promise<Result<Record<string, unknown> | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select(`
          *,
          items:cart_items(
            *,
            variant:product_variants(
              *,
              product:products(*)
            )
          )
        `)
        .eq('id', cartId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findWithItems'));
      }

      return success(data || null);
    } catch (err) {
      return failure(this.handleError(err, 'findWithItems'));
    }
  }
}
