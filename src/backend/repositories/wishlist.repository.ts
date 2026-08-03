import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { Wishlist } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface WishlistRepository extends IBaseRepository<Wishlist, string, Partial<Wishlist>, Partial<Wishlist>> {
  findByUserId(userId: string): Promise<Result<Wishlist[], AppError>>;
  findByUserAndProduct(userId: string, productId: string): Promise<Result<Wishlist | null, AppError>>;
  deleteByUserAndProduct(userId: string, productId: string): Promise<Result<boolean, AppError>>;
  removeByUserIdAndProductId(userId: string, productId: string): Promise<Result<boolean, AppError>>;
}

export class SupabaseWishlistRepository
  extends BaseRepository<Wishlist, string, Partial<Wishlist>, Partial<Wishlist>>
  implements WishlistRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('wishlists', clientOrGetter || (() => getServerClient()));
  }

  public async findByUserId(userId: string): Promise<Result<Wishlist[], AppError>> {
    return this.findAll({ user_id: userId });
  }

  public async findByUserAndProduct(userId: string, productId: string): Promise<Result<Wishlist | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findByUserAndProduct'));
      }

      return success((data as Wishlist) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findByUserAndProduct'));
    }
  }

  public async deleteByUserAndProduct(userId: string, productId: string): Promise<Result<boolean, AppError>> {
    try {
      const client = this.getClient();
      const { error } = await client
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        return failure(this.handleError(error, 'deleteByUserAndProduct'));
      }

      return success(true);
    } catch (err) {
      return failure(this.handleError(err, 'deleteByUserAndProduct'));
    }
  }

  public async removeByUserIdAndProductId(userId: string, productId: string): Promise<Result<boolean, AppError>> {
    return this.deleteByUserAndProduct(userId, productId);
  }
}
