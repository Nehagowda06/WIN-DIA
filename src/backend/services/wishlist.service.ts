import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { Wishlist } from '../models/domain-models.types';
import { WishlistRepository } from '../repositories/wishlist.repository';
import { ProductRepository } from '../repositories/product.repository';
import { CartService } from './cart.service';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens, ServiceTokens } from '../providers/container.provider';

export interface WishlistService {
  getWishlist(userId: string): Promise<Result<Wishlist[], AppError>>;
  addToWishlist(userId: string, productId: string): Promise<Result<Wishlist, AppError>>;
  removeFromWishlist(userId: string, productId: string): Promise<Result<boolean, AppError>>;
  moveToCart(userId: string, productId: string): Promise<Result<boolean, AppError>>;
}

export class WishlistServiceImpl implements WishlistService {
  private wishlistRepo: WishlistRepository;
  // productRepo reserved for future stock checks before move-to-cart
  private productRepo: ProductRepository;

  constructor(wishlistRepo?: WishlistRepository, productRepo?: ProductRepository) {
    this.wishlistRepo = wishlistRepo || container.resolve<WishlistRepository>(RepositoryTokens.WishlistRepository);
    this.productRepo = productRepo || container.resolve<ProductRepository>(RepositoryTokens.ProductRepository);
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

  public async moveToCart(userId: string, productId: string): Promise<Result<boolean, AppError>> {
    logger.info(`[WishlistService.moveToCart] User ${userId} moving product ${productId} to cart`);

    const cartService = container.resolve<CartService>(ServiceTokens.CartService);

    const cartRes = await cartService.getCart(userId);
    if (!cartRes.success) return failure(cartRes.error);

    const addRes = await cartService.addItem(cartRes.value.cart.id, { product_id: productId, quantity: 1 });
    if (!addRes.success) return failure(addRes.error);

    await this.removeFromWishlist(userId, productId);
    return success(true);
  }
}