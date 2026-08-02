import { BaseRepository, IBaseRepository } from './base.repository';
import { CartItem } from '../models/domain-models.types';
import { AddToCartDTO, UpdateCartItemDTO } from '../types/dto.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface CartItemRepository extends IBaseRepository<CartItem, string, AddToCartDTO & { cart_id: string }, UpdateCartItemDTO> {
  findByCartId(cartId: string): Promise<Result<CartItem[], AppError>>;
  findItem(cartId: string, variantId: string): Promise<Result<CartItem | null, AppError>>;
  deleteByCartId(cartId: string): Promise<Result<boolean, AppError>>;
}

export class SupabaseCartItemRepository
  extends BaseRepository<CartItem, string, AddToCartDTO & { cart_id: string }, UpdateCartItemDTO>
  implements CartItemRepository {
  constructor() {
    super('cart_items');
  }

  public async findByCartId(cartId: string): Promise<Result<CartItem[], AppError>> {
    return this.findAll({ cart_id: cartId });
  }

  public async findItem(cartId: string, variantId: string): Promise<Result<CartItem | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('cart_id', cartId)
        .eq('variant_id', variantId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findItem'));
      }

      return success((data as CartItem) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findItem'));
    }
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
