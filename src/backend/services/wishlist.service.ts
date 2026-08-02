import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { Wishlist } from '../models/domain-models.types';
import { WishlistRepository } from '../repositories/wishlist.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { CartService } from './cart.service';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface WishlistService {
  getWishlist(userId: string): Promise<Result<Wishlist[], AppError>>;
  addToWishlist(userId: string, productId: string): Promise<Result<Wishlist, AppError>>;
  removeFromWishlist(userId: string, productId: string): Promise<Result<boolean, AppError>>;
  moveToCart(userId: string, productId: string, variantId: string): Promise<Result<boolean, AppError>>;
}

export class WishlistServiceImpl implements WishlistService {
  private wishlistRepo: WishlistRepository;
  private variantRepo: ProductVariantRepository;

  constructor(wishlistRepo?: WishlistRepository, variantRepo?: ProductVariantRepository) {
    this.wishlistRepo = wishlistRepo || container.resolve<WishlistRepository>(RepositoryTokens.WishlistRepository);
    this.variantRepo = variantRepo || container.resolve<ProductVariantRepository>(RepositoryTokens.ProductVariantRepository);
  }

  public async getWishlist(userId: string): Promise<Result<Wishlist[], AppError>> {
    return this.wishlistRepo.findByUserId(userId);
  }

  public async addToWishlist(userId: string, productId: string): Promise<Result<Wishlist, AppError>> {
    logger.info(`[WishlistService.addToWishlist] User ${userId} adding product ${productId}`);
    const existing = await this.wishlistRepo.findByUserId(userId);
    if (!existing.success) return failure(existing.error);

    const alreadyAdded = existing.value.find((item) => item.product_id === productId);
    if (alreadyAdded) {
      return success(alreadyAdded);
    }

    return this.wishlistRepo.create({ user_id: userId, product_id: productId });
  }

  public async removeFromWishlist(userId: string, productId: string): Promise<Result<boolean, AppError>> {
    return this.wishlistRepo.removeByUserIdAndProductId(userId, productId);
  }

  public async moveToCart(userId: string, productId: string, variantId: string): Promise<Result<boolean, AppError>> {
    logger.info(`[WishlistService.moveToCart] User ${userId} moving product ${productId} variant ${variantId} to cart`);
    const cartService = container.resolve<CartService>('CartService');
    const cartRes = await cartService.getCart(userId);
    if (!cartRes.success) return failure(cartRes.error);

    const addRes = await cartService.addItem(cartRes.value.cart.id, { variant_id: variantId, quantity: 1 });
    if (!addRes.success) return failure(addRes.error);

    await this.removeFromWishlist(userId, productId);
    return success(true);
  }
}
