import { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient, getAdminClient } from '../config/supabase.config';
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

/**
 * Request-Scoped DI Container Instance.
 * Encapsulates the request's authenticated SupabaseClient instance and reuses it
 * across every repository and service participating in the request execution.
 */
export class RequestScopedContainer {
  private client: SupabaseClient;
  private cache = new Map<string | symbol, unknown>();

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  public getClient(): SupabaseClient {
    return this.client;
  }

  public resolve<T>(key: string | symbol): T {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    const instance = this.createInstance<T>(key);
    this.cache.set(key, instance);
    return instance;
  }

  private createInstance<T>(key: string | symbol): T {
    switch (key) {
      // Repositories (Injected with Request-Scoped Authenticated SupabaseClient)
      case RepositoryTokens.ProfileRepository:
        return new SupabaseProfileRepository(this.client) as any;
      case RepositoryTokens.AddressRepository:
        return new SupabaseAddressRepository(this.client) as any;
      case RepositoryTokens.CategoryRepository:
        return new SupabaseCategoryRepository(this.client) as any;
      case RepositoryTokens.ProductRepository:
        return new SupabaseProductRepository(getAdminClient()) as any;
      case RepositoryTokens.ProductVariantRepository:
        return new SupabaseProductVariantRepository(this.client) as any;
      case RepositoryTokens.ProductImageRepository:
        return new SupabaseProductImageRepository(this.client) as any;
      case RepositoryTokens.WishlistRepository:
        return new SupabaseWishlistRepository(this.client) as any;
      case RepositoryTokens.CartRepository:
        return new SupabaseCartRepository(this.client) as any;
      case RepositoryTokens.CartItemRepository:
        return new SupabaseCartItemRepository(this.client) as any;
      case RepositoryTokens.OrderRepository:
        return new SupabaseOrderRepository(getAdminClient()) as any;
      case RepositoryTokens.OrderItemRepository:
        return new SupabaseOrderItemRepository(getAdminClient()) as any;
      case RepositoryTokens.OrderStatusHistoryRepository:
        return new SupabaseOrderStatusHistoryRepository(getAdminClient()) as any;
      case RepositoryTokens.ShipmentRepository:
        return new SupabaseShipmentRepository(getAdminClient()) as any;
      case RepositoryTokens.ShipmentTrackingEventRepository:
        return new SupabaseShipmentTrackingEventRepository(getAdminClient()) as any;
      case RepositoryTokens.PaymentRepository:
        return new SupabasePaymentRepository(getAdminClient()) as any;
      case RepositoryTokens.PaymentEventRepository:
        return new SupabasePaymentEventRepository(getAdminClient()) as any;
      case RepositoryTokens.ProductReviewRepository:
        return new SupabaseProductReviewRepository(this.client) as any;
      case RepositoryTokens.CouponRepository:
        return new SupabaseCouponRepository(this.client) as any;
      case RepositoryTokens.ContactMessageRepository:
        return new SupabaseContactMessageRepository(this.client) as any;
      case RepositoryTokens.SettingsRepository:
        return new SupabaseSettingsRepository(this.client) as any;
      case RepositoryTokens.PageContentRepository:
        return new SupabasePageContentRepository(this.client) as any;
      case RepositoryTokens.BannerRepository:
        return new SupabaseBannerRepository(this.client) as any;

      // Services (Injected with Request-Scoped Repositories & Dependent Services)
      case ServiceTokens.AuthService:
        return new AuthServiceImpl() as any;
      case ServiceTokens.UserService:
        return new UserServiceImpl(
          this.resolve(RepositoryTokens.ProfileRepository),
          this.resolve(RepositoryTokens.AddressRepository)
        ) as any;
      case ServiceTokens.CategoryService:
        return new CategoryServiceImpl(
          this.resolve(RepositoryTokens.CategoryRepository)
        ) as any;
      case ServiceTokens.ProductService:
        return new ProductServiceImpl(
          this.resolve(RepositoryTokens.ProductRepository),
          this.resolve(RepositoryTokens.CategoryRepository)
        ) as any;
      case ServiceTokens.CartService:
        return new CartServiceImpl(
          this.resolve(RepositoryTokens.CartRepository),
          this.resolve(RepositoryTokens.CartItemRepository),
          this.resolve(RepositoryTokens.ProductRepository)
        ) as any;
      case ServiceTokens.WishlistService:
        return new WishlistServiceImpl(
          this.resolve(RepositoryTokens.WishlistRepository),
          this.resolve(RepositoryTokens.ProductRepository)
        ) as any;
      case ServiceTokens.InventoryService:
        return new InventoryServiceImpl(
          this.resolve(RepositoryTokens.ProductRepository)
        ) as any;
      case ServiceTokens.CouponService:
        return new CouponServiceImpl(
          this.resolve(RepositoryTokens.CouponRepository)
        ) as any;
      case ServiceTokens.OrderService:
        return new OrderServiceImpl(
          this.resolve(RepositoryTokens.OrderRepository),
          this.resolve(RepositoryTokens.OrderItemRepository),
          this.resolve(RepositoryTokens.OrderStatusHistoryRepository),
          this.resolve(ServiceTokens.InventoryService)
        ) as any;
      case ServiceTokens.PaymentService:
        return new PaymentServiceImpl(
          this.resolve(RepositoryTokens.PaymentRepository),
          this.resolve(RepositoryTokens.PaymentEventRepository),
          this.resolve(RepositoryTokens.OrderRepository),
          this.resolve(RepositoryTokens.OrderItemRepository),
          this.resolve(ServiceTokens.InventoryService)
        ) as any;
      case ServiceTokens.ShipmentService:
        return new ShipmentServiceImpl(
          this.resolve(RepositoryTokens.ShipmentRepository),
          this.resolve(RepositoryTokens.ShipmentTrackingEventRepository)
        ) as any;
      case ServiceTokens.ReviewService:
        return new ReviewServiceImpl(
          this.resolve(RepositoryTokens.ProductReviewRepository)
        ) as any;
      case ServiceTokens.ContactService:
        return new ContactServiceImpl(
          this.resolve(RepositoryTokens.ContactMessageRepository)
        ) as any;
      case ServiceTokens.CMSService:
        return new CMSServiceImpl(
          this.resolve(RepositoryTokens.PageContentRepository),
          this.resolve(RepositoryTokens.BannerRepository)
        ) as any;
      case ServiceTokens.SettingsService:
        return new SettingsServiceImpl(
          this.resolve(RepositoryTokens.SettingsRepository)
        ) as any;
      case ServiceTokens.CheckoutService:
        return new CheckoutServiceImpl(
          this.resolve(ServiceTokens.UserService),
          this.resolve(ServiceTokens.CartService),
          this.resolve(RepositoryTokens.ProductRepository),
          this.resolve(RepositoryTokens.OrderRepository),
          this.resolve(ServiceTokens.InventoryService),
          this.resolve(ServiceTokens.CouponService),
          this.resolve(ServiceTokens.OrderService),
          this.resolve(ServiceTokens.PaymentService),
          this.resolve(ServiceTokens.ShipmentService)
        ) as any;

      default:
        throw new Error(`ServiceContainer: Unknown key "${String(key)}"`);
    }
  }
}

export class ServiceContainer {
  private static instance: ServiceContainer | null = null;

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Creates a request-scoped dependency container for an incoming HTTP request.
   * Initializes the authenticated SupabaseClient ONCE using the request's Authorization header,
   * and injects the SAME client instance into all repositories and services resolved for that request.
   */
  public createRequestScope(authHeader?: string | SupabaseClient): RequestScopedContainer {
    const client = typeof authHeader === 'string'
      ? getServerClient(authHeader)
      : (authHeader || getServerClient());

    return new RequestScopedContainer(client);
  }

  public resolve<T>(key: string | symbol, authHeader?: string | SupabaseClient): T {
    const scope = this.createRequestScope(authHeader);
    return scope.resolve<T>(key);
  }
}

export const container = ServiceContainer.getInstance();
