import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError, ValidationError } from '../errors/domain-errors';
import { Cart, CartItem } from '../models/domain-models.types';
import { AddToCartDTO, UpdateCartItemDTO } from '../types/dto.types';
import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface CartService {
  getCart(userId?: string, sessionId?: string): Promise<Result<{ cart: Cart; items: CartItem[] }, AppError>>;
  addItem(cartId: string, dto: AddToCartDTO): Promise<Result<CartItem, AppError>>;
  updateItemQuantity(cartId: string, variantId: string, dto: UpdateCartItemDTO): Promise<Result<CartItem, AppError>>;
  removeItem(cartId: string, variantId: string): Promise<Result<boolean, AppError>>;
  clearCart(cartId: string): Promise<Result<boolean, AppError>>;
  mergeGuestCart(sessionId: string, userId: string): Promise<Result<{ cart: Cart; items: CartItem[] }, AppError>>;
  calculateSubtotal(items: CartItem[]): Promise<Result<number, AppError>>;
}

export class CartServiceImpl implements CartService {
  private cartRepo: CartRepository;
  private cartItemRepo: CartItemRepository;
  private variantRepo: ProductVariantRepository;

  constructor(
    cartRepo?: CartRepository,
    cartItemRepo?: CartItemRepository,
    variantRepo?: ProductVariantRepository
  ) {
    this.cartRepo = cartRepo || container.resolve<CartRepository>(RepositoryTokens.CartRepository);
    this.cartItemRepo = cartItemRepo || container.resolve<CartItemRepository>(RepositoryTokens.CartItemRepository);
    this.variantRepo = variantRepo || container.resolve<ProductVariantRepository>(RepositoryTokens.ProductVariantRepository);
  }

  public async getCart(userId?: string, sessionId?: string): Promise<Result<{ cart: Cart; items: CartItem[] }, AppError>> {
    if (!userId && !sessionId) {
      return failure(new ValidationError('Either userId or sessionId is required to access cart'));
    }

    let cartRes: Result<Cart | null, AppError>;
    if (userId) {
      cartRes = await this.cartRepo.findByUserId(userId);
    } else {
      cartRes = await this.cartRepo.findBySessionId(sessionId!);
    }

    if (!cartRes.success) return failure(cartRes.error);

    let cart = cartRes.value;
    if (!cart) {
      const createRes = await this.cartRepo.create({
        user_id: userId || null,
        session_id: sessionId || null,
      });
      if (!createRes.success) return failure(createRes.error);
      cart = createRes.value;
    }

    const itemsRes = await this.cartItemRepo.findByCartId(cart.id);
    if (!itemsRes.success) return failure(itemsRes.error);

    return success({ cart, items: itemsRes.value });
  }

  public async addItem(cartId: string, dto: AddToCartDTO): Promise<Result<CartItem, AppError>> {
    logger.info(`[CartService.addItem] Adding variant ${dto.variant_id} to cart ${cartId}`);
    const variantRes = await this.variantRepo.findById(dto.variant_id);
    if (!variantRes.success) return failure(variantRes.error);
    if (!variantRes.value || !variantRes.value.is_active) {
      return failure(new NotFoundError('Product variant is no longer active or available'));
    }

    const existingRes = await this.cartItemRepo.findItem(cartId, dto.variant_id);
    if (!existingRes.success) return failure(existingRes.error);

    if (existingRes.value) {
      const newQty = existingRes.value.quantity + dto.quantity;
      return this.cartItemRepo.update(existingRes.value.id, { quantity: newQty });
    }

    return this.cartItemRepo.create({
      cart_id: cartId,
      variant_id: dto.variant_id,
      quantity: dto.quantity,
    });
  }

  public async updateItemQuantity(cartId: string, variantId: string, dto: UpdateCartItemDTO): Promise<Result<CartItem, AppError>> {
    const itemRes = await this.cartItemRepo.findItem(cartId, variantId);
    if (!itemRes.success) return failure(itemRes.error);
    if (!itemRes.value) {
      return failure(new NotFoundError('Item not found in cart'));
    }

    if (dto.quantity <= 0) {
      await this.cartItemRepo.delete(itemRes.value.id);
      return failure(new ValidationError('Item removed from cart because quantity was set to 0'));
    }

    return this.cartItemRepo.update(itemRes.value.id, { quantity: dto.quantity });
  }

  public async removeItem(cartId: string, variantId: string): Promise<Result<boolean, AppError>> {
    return this.cartItemRepo.deleteByCartId(cartId);
  }

  public async clearCart(cartId: string): Promise<Result<boolean, AppError>> {
    return this.cartItemRepo.deleteByCartId(cartId);
  }

  public async mergeGuestCart(sessionId: string, userId: string): Promise<Result<{ cart: Cart; items: CartItem[] }, AppError>> {
    logger.info(`[CartService.mergeGuestCart] Merging guest cart ${sessionId} for user ${userId}`);
    const guestCartRes = await this.getCart(undefined, sessionId);
    const userCartRes = await this.getCart(userId);

    if (!userCartRes.success) return userCartRes;
    const userCart = userCartRes.value.cart;

    if (guestCartRes.success && guestCartRes.value.items.length > 0) {
      for (const item of guestCartRes.value.items) {
        await this.addItem(userCart.id, { variant_id: item.variant_id, quantity: item.quantity });
      }
      await this.cartRepo.delete(guestCartRes.value.cart.id);
    }

    return this.getCart(userId);
  }

  public async calculateSubtotal(items: CartItem[]): Promise<Result<number, AppError>> {
    let total = 0;
    for (const item of items) {
      const vRes = await this.variantRepo.findById(item.variant_id);
      if (vRes.success && vRes.value) {
        total += Number(vRes.value.price) * item.quantity;
      }
    }
    return success(total);
  }
}
