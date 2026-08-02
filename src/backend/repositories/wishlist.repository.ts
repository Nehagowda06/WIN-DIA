import { BaseRepository, IBaseRepository } from './base.repository';
import { Wishlist } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface WishlistRepository extends IBaseRepository<Wishlist, string, { user_id: string; product_id: string }, Partial<Wishlist>> {
  findByUserId(userId: string): Promise<Result<Wishlist[], AppError>>;
  findWithProducts(userId: string): Promise<Result<Record<string, unknown>[], AppError>>;
  removeByUserIdAndProductId(userId: string, productId: string): Promise<Result<boolean, AppError>>;
}

export class SupabaseWishlistRepository
  extends BaseRepository<Wishlist, string, { user_id: string; product_id: string }, Partial<Wishlist>>
  implements WishlistRepository {
  constructor() {
    super('wishlists');
  }

  public async findByUserId(userId: string): Promise<Result<Wishlist[], AppError>> {
    return this.findAll({ user_id: userId });
  }

  public async findWithProducts(userId: string): Promise<Result<Record<string, unknown>[], AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select(`
          *,
          product:products(
            *,
            images:product_images(*),
            variants:product_variants(*)
          )
        `)
        .eq('user_id', userId);

      if (error) {
        return failure(this.handleError(error, 'findWithProducts'));
      }

      return success(data || []);
    } catch (err) {
      return failure(this.handleError(err, 'findWithProducts'));
    }
  }

  public async removeByUserIdAndProductId(userId: string, productId: string): Promise<Result<boolean, AppError>> {
    try {
      const client = this.getClient();
      const { error } = await client
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        return failure(this.handleError(error, 'removeByUserIdAndProductId'));
      }

      return success(true);
    } catch (err) {
      return failure(this.handleError(err, 'removeByUserIdAndProductId'));
    }
  }
}
