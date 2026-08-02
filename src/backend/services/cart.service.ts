import { Cart, CartItem, Wishlist } from '../models/domain-models.types';
import { AddToCartDTO, UpdateCartItemDTO } from '../types/dto.types';
import { Result } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface CartService {
  getCart(userId?: string, sessionId?: string): Promise<Result<{ cart: Cart; items: CartItem[] }, AppError>>;
  addItem(cartId: string, dto: AddToCartDTO): Promise<Result<CartItem, AppError>>;
  updateItemQuantity(cartId: string, variantId: string, dto: UpdateCartItemDTO): Promise<Result<CartItem, AppError>>;
  removeItem(cartId: string, variantId: string): Promise<Result<boolean, AppError>>;
  clearCart(cartId: string): Promise<Result<boolean, AppError>>;
  getWishlist(userId: string): Promise<Result<Wishlist[], AppError>>;
  addToWishlist(userId: string, productId: string): Promise<Result<Wishlist, AppError>>;
  removeFromWishlist(userId: string, productId: string): Promise<Result<boolean, AppError>>;
}
