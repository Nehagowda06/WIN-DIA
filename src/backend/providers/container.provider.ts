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

import { AuthServiceImpl } from '../services/auth.service';
import { UserServiceImpl } from '../services/user.service';
import { CategoryServiceImpl } from '../services/category.service';
import { ProductServiceImpl } from '../services/product.service';
import { CartServiceImpl } from '../services/cart.service';
import { WishlistServiceImpl } from '../services/wishlist.service';
import { InventoryServiceImpl } from '../services/inventory.service';
import { CouponServiceImpl } from '../services/coupon.service';
import { CheckoutServiceImpl } from '../services/checkout.service';
import { OrderServiceImpl } from '../services/order.service';
import { PaymentServiceImpl } from '../services/payment.service';
import { ShipmentServiceImpl } from '../services/shipment.service';
import { ReviewServiceImpl } from '../services/review.service';
import { ContactServiceImpl } from '../services/contact.service';
import { CMSServiceImpl } from '../services/cms.service';
import { SettingsServiceImpl } from '../services/settings.service';

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

export const ServiceTokens = {
  AuthService: 'AuthService',
  UserService: 'UserService',
  CategoryService: 'CategoryService',
  ProductService: 'ProductService',
  CartService: 'CartService',
  WishlistService: 'WishlistService',
  InventoryService: 'InventoryService',
  CouponService: 'CouponService',
  CheckoutService: 'CheckoutService',
  OrderService: 'OrderService',
  PaymentService: 'PaymentService',
  ShipmentService: 'ShipmentService',
  ReviewService: 'ReviewService',
  ContactService: 'ContactService',
  CMSService: 'CMSService',
  SettingsService: 'SettingsService',
} as const;

export class ServiceContainer {
  private static instance: ServiceContainer | null = null;
  private services = new Map<string | symbol, unknown>();
  private factories = new Map<string | symbol, Factory<unknown>>();

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
      ServiceContainer.instance.registerRepositories();
      ServiceContainer.instance.registerServices();
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

  private registerServices(): void {
    this.registerFactory(ServiceTokens.AuthService, () => new AuthServiceImpl());
    this.registerFactory(ServiceTokens.UserService, () => new UserServiceImpl());
    this.registerFactory(ServiceTokens.CategoryService, () => new CategoryServiceImpl());
    this.registerFactory(ServiceTokens.ProductService, () => new ProductServiceImpl());
    this.registerFactory(ServiceTokens.CartService, () => new CartServiceImpl());
    this.registerFactory(ServiceTokens.WishlistService, () => new WishlistServiceImpl());
    this.registerFactory(ServiceTokens.InventoryService, () => new InventoryServiceImpl());
    this.registerFactory(ServiceTokens.CouponService, () => new CouponServiceImpl());
    this.registerFactory(ServiceTokens.OrderService, () => new OrderServiceImpl());
    this.registerFactory(ServiceTokens.PaymentService, () => new PaymentServiceImpl());
    this.registerFactory(ServiceTokens.ShipmentService, () => new ShipmentServiceImpl());
    this.registerFactory(ServiceTokens.ReviewService, () => new ReviewServiceImpl());
    this.registerFactory(ServiceTokens.ContactService, () => new ContactServiceImpl());
    this.registerFactory(ServiceTokens.CMSService, () => new CMSServiceImpl());
    this.registerFactory(ServiceTokens.SettingsService, () => new SettingsServiceImpl());
    this.registerFactory(ServiceTokens.CheckoutService, () => new CheckoutServiceImpl());
  }
}

export const container = ServiceContainer.getInstance();
