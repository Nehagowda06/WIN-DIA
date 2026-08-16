import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { CartItem } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface CartItemRepository extends IBaseRepository<CartItem, string, Partial<CartItem>, Partial<CartItem>> {
  findByCartId(cartId: string): Promise<Result<CartItem[], AppError>>;
  findByCartAndProduct(cartId: string, productId: string): Promise<Result<CartItem | null, AppError>>;
  findItem(cartId: string, productId: string): Promise<Result<CartItem | null, AppError>>;
  deleteByCartId(cartId: string): Promise<Result<boolean, AppError>>;
}

export class SupabaseCartItemRepository
  extends BaseRepository<CartItem, string, Partial<CartItem>, Partial<CartItem>>
  implements CartItemRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('cart_items', clientOrGetter || (() => getServerClient()));
  }

  public async findByCartId(cartId: string): Promise<Result<CartItem[], AppError>> {
    return this.findAll({ cart_id: cartId });
  }

  public async findByCartAndProduct(cartId: string, productId: string): Promise<Result<CartItem | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findByCartAndProduct'));
      }

      return success((data as CartItem) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findByCartAndProduct'));
    }
  }

  public async findItem(cartId: string, productId: string): Promise<Result<CartItem | null, AppError>> {
    return this.findByCartAndProduct(cartId, productId);
  }

  public async deleteByCartId(cartId: string): Promise<Result<boolean, AppError>> {
    try {
      const client = this.getClient();
      const { error } = await client
        .from(this.tableName)
        .delete()
        .eq('cart_id', cartId);

      if (error) {
        return failure(this.handleError(error, 'deleteByCartId'));
      }

      return success(true);
    } catch (err) {
      return failure(this.handleError(err, 'deleteByCartId'));
    }
  }
}
