import { SupabaseProfileRepository } from '../repositories/profile.repository';
import { SupabaseAddressRepository } from '../repositories/address.repository';
import { SupabaseCategoryRepository } from '../repositories/category.repository';
import { SupabaseProductRepository } from '../repositories/product.repository';
import { SupabaseProductVariantRepository } from '../repositories/product-variant.repository';
import { SupabaseProductImageRepository } from '../repositories/product-image.repository';
import { SupabaseWishlistRepository } from '../repositories/wishlist.repository';
import { SupabaseCartRepository } from '../repositories/cart.repository';
import { SupabaseCartItemRepository } from '../repositories/cart-item.repository';
import { SupabaseOrderRepository } from '../repositories/order.repository';
import { SupabaseOrderItemRepository } from '../repositories/order-item.repository';
import { SupabaseOrderStatusHistoryRepository } from '../repositories/order-status-history.repository';
import { SupabaseShipmentRepository } from '../repositories/shipment.repository';
import { SupabaseShipmentTrackingEventRepository } from '../repositories/shipment-tracking-event.repository';
import { SupabasePaymentRepository } from '../repositories/payment.repository';
import { SupabasePaymentEventRepository } from '../repositories/payment-event.repository';
import { SupabaseProductReviewRepository } from '../repositories/review.repository';
import { SupabaseCouponRepository } from '../repositories/coupon.repository';
import { SupabaseContactMessageRepository } from '../repositories/contact-message.repository';
import { SupabaseSettingsRepository } from '../repositories/settings.repository';
import { SupabasePageContentRepository } from '../repositories/page-content.repository';
import { SupabaseBannerRepository } from '../repositories/banner.repository';

export type Factory<T> = (container: ServiceContainer) => T;

export const RepositoryTokens = {
  ProfileRepository: 'ProfileRepository',
  AddressRepository: 'AddressRepository',
  CategoryRepository: 'CategoryRepository',
  ProductRepository: 'ProductRepository',
  ProductVariantRepository: 'ProductVariantRepository',
  ProductImageRepository: 'ProductImageRepository',
  WishlistRepository: 'WishlistRepository',
  CartRepository: 'CartRepository',
  CartItemRepository: 'CartItemRepository',
  OrderRepository: 'OrderRepository',
  OrderItemRepository: 'OrderItemRepository',
  OrderStatusHistoryRepository: 'OrderStatusHistoryRepository',
  ShipmentRepository: 'ShipmentRepository',
  ShipmentTrackingEventRepository: 'ShipmentTrackingEventRepository',
  PaymentRepository: 'PaymentRepository',
  PaymentEventRepository: 'PaymentEventRepository',
  ProductReviewRepository: 'ProductReviewRepository',
  CouponRepository: 'CouponRepository',
  ContactMessageRepository: 'ContactMessageRepository',
  SettingsRepository: 'SettingsRepository',
  PageContentRepository: 'PageContentRepository',
  BannerRepository: 'BannerRepository',
} as const;

export class ServiceContainer {
  private static instance: ServiceContainer | null = null;
  private services = new Map<string | symbol, unknown>();
  private factories = new Map<string | symbol, Factory<unknown>>();

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
      ServiceContainer.instance.registerRepositories();
    }
    return ServiceContainer.instance;
  }

  public register<T>(key: string | symbol, instance: T): void {
    this.services.set(key, instance);
  }

  public registerFactory<T>(key: string | symbol, factory: Factory<T>): void {
    this.factories.set(key, factory as Factory<unknown>);
  }

  public resolve<T>(key: string | symbol): T {
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }

    if (this.factories.has(key)) {
      const factory = this.factories.get(key) as Factory<T>;
      const instance = factory(this);
      this.services.set(key, instance);
      return instance;
    }

    throw new Error(`ServiceContainer: No service registered for key "${String(key)}"`);
  }

  public has(key: string | symbol): boolean {
    return this.services.has(key) || this.factories.has(key);
  }

  public clear(): void {
    this.services.clear();
    this.factories.clear();
  }

  private registerRepositories(): void {
    this.registerFactory(RepositoryTokens.ProfileRepository, () => new SupabaseProfileRepository());
    this.registerFactory(RepositoryTokens.AddressRepository, () => new SupabaseAddressRepository());
    this.registerFactory(RepositoryTokens.CategoryRepository, () => new SupabaseCategoryRepository());
    this.registerFactory(RepositoryTokens.ProductRepository, () => new SupabaseProductRepository());
    this.registerFactory(RepositoryTokens.ProductVariantRepository, () => new SupabaseProductVariantRepository());
    this.registerFactory(RepositoryTokens.ProductImageRepository, () => new SupabaseProductImageRepository());
    this.registerFactory(RepositoryTokens.WishlistRepository, () => new SupabaseWishlistRepository());
    this.registerFactory(RepositoryTokens.CartRepository, () => new SupabaseCartRepository());
    this.registerFactory(RepositoryTokens.CartItemRepository, () => new SupabaseCartItemRepository());
    this.registerFactory(RepositoryTokens.OrderRepository, () => new SupabaseOrderRepository());
    this.registerFactory(RepositoryTokens.OrderItemRepository, () => new SupabaseOrderItemRepository());
    this.registerFactory(RepositoryTokens.OrderStatusHistoryRepository, () => new SupabaseOrderStatusHistoryRepository());
    this.registerFactory(RepositoryTokens.ShipmentRepository, () => new SupabaseShipmentRepository());
    this.registerFactory(RepositoryTokens.ShipmentTrackingEventRepository, () => new SupabaseShipmentTrackingEventRepository());
    this.registerFactory(RepositoryTokens.PaymentRepository, () => new SupabasePaymentRepository());
    this.registerFactory(RepositoryTokens.PaymentEventRepository, () => new SupabasePaymentEventRepository());
    this.registerFactory(RepositoryTokens.ProductReviewRepository, () => new SupabaseProductReviewRepository());
    this.registerFactory(RepositoryTokens.CouponRepository, () => new SupabaseCouponRepository());
    this.registerFactory(RepositoryTokens.ContactMessageRepository, () => new SupabaseContactMessageRepository());
    this.registerFactory(RepositoryTokens.SettingsRepository, () => new SupabaseSettingsRepository());
    this.registerFactory(RepositoryTokens.PageContentRepository, () => new SupabasePageContentRepository());
    this.registerFactory(RepositoryTokens.BannerRepository, () => new SupabaseBannerRepository());
  }
}

export const container = ServiceContainer.getInstance();
