# Implementation Plan: WIN-DIA Repository Layer (Supabase Implementations)

This document details the technical implementation plan for the **Repository Layer** inside `src/backend/repositories/supabase/`. All repository implementations will communicate strictly with PostgreSQL via Supabase clients (`@supabase/supabase-js`), providing strongly-typed CRUD, joins, filtering, pagination, RPC execution, and Supabase storage interactions.

## User Review Required

> [!IMPORTANT]
> **Strict Layer Boundaries**:
> - Repositories contain **zero business logic, zero validation, zero calculation, zero HTTP handling, and zero authorization checks**.
> - All repository methods return standard `Result<T, AppError>` types for predictable consumer handling.
> - Concrete Supabase implementations will be registered in `ServiceContainer` (`src/backend/providers/container.provider.ts`) for clean dependency injection.

## Open Questions

None. The database architecture is final as per `DATABASE_ARCHITECTURE.md`.

## Proposed Changes

We will implement concrete Supabase repositories under `src/backend/repositories/supabase/`:

### [Supabase Repository Implementations]

#### [NEW] [supabase-base.repository.ts](file:///d:/win-dia/src/backend/repositories/supabase/supabase-base.repository.ts)
Abstract base class `SupabaseBaseRepository<T, ID, CreateDTO, UpdateDTO>` providing generic Supabase CRUD operations (`findById`, `findAll`, `create`, `update`, `delete`), query error wrapping, and pagination helpers to eliminate boilerplate code.

#### [NEW] [supabase-user.repository.ts](file:///d:/win-dia/src/backend/repositories/supabase/supabase-user.repository.ts)
- `SupabaseUserRepository`: `profiles` table CRUD, `findByEmail`, `findByPhone`.
- `SupabaseAddressRepository`: `addresses` table CRUD, `findByUserId`, `findDefaultAddress`, `setDefaultAddress`.

#### [NEW] [supabase-product.repository.ts](file:///d:/win-dia/src/backend/repositories/supabase/supabase-product.repository.ts)
- `SupabaseProductRepository`: `products` table CRUD with joins to categories/variants/images, `findBySlug`, `findFeatured`, `findWithPagination`.
- `SupabaseProductVariantRepository`: `product_variants` table CRUD, `findByProductId`, `findBySku`, `updateStock`.
- `SupabaseCategoryRepository`: `categories` table CRUD, `findBySlug`, `findRootCategories`.
- `SupabaseProductImageRepository`: `product_images` table CRUD, `findByProductId`, and Supabase Storage image upload/delete.

#### [NEW] [supabase-cart.repository.ts](file:///d:/win-dia/src/backend/repositories/supabase/supabase-cart.repository.ts)
- `SupabaseCartRepository`: `carts` table CRUD, `findByUserId`, `findBySessionId`, `getCartWithItems`, `clearCart`.
- `SupabaseCartItemRepository`: `cart_items` table CRUD, `findByCartId`, `findItem`, `removeItem`.
- `SupabaseWishlistRepository`: `wishlists` table CRUD with product joins, `findByUserId`, `removeProduct`.

#### [NEW] [supabase-order.repository.ts](file:///d:/win-dia/src/backend/repositories/supabase/supabase-order.repository.ts)
- `SupabaseOrderRepository`: `orders` table CRUD with order_items joins, `findByOrderNumber`, `findByUserId`, `updateStatus`.
- `SupabaseOrderItemRepository`: `order_items` table CRUD, `findByOrderId`.
- `SupabaseOrderStatusHistoryRepository`: `order_status_history` table CRUD, `findByOrderId`.

#### [NEW] [supabase-payment.repository.ts](file:///d:/win-dia/src/backend/repositories/supabase/supabase-payment.repository.ts)
- `SupabasePaymentRepository`: `payments` table CRUD, `findByOrderId`, `findByTransactionId`, `updateStatus`.
- `SupabasePaymentEventRepository`: `payment_events` table CRUD, `findByPaymentId`.

#### [NEW] [supabase-shipment.repository.ts](file:///d:/win-dia/src/backend/repositories/supabase/supabase-shipment.repository.ts)
- `SupabaseShipmentRepository`: `shipments` table CRUD, `findByOrderId`, `findByTrackingNumber`, `updateStatus`.
- `SupabaseShipmentTrackingEventRepository`: `shipment_tracking_events` table CRUD, `findByShipmentId`.

#### [NEW] [supabase-review.repository.ts](file:///d:/win-dia/src/backend/repositories/supabase/supabase-review.repository.ts)
- `SupabaseReviewRepository`: `product_reviews` table CRUD, `findByProductId`, `findByUserId`, `updateStatus`, `getAverageRating`.

#### [NEW] [supabase-coupon.repository.ts](file:///d:/win-dia/src/backend/repositories/supabase/supabase-coupon.repository.ts)
- `SupabaseCouponRepository`: `coupons` table CRUD, `findByCode`, `incrementUsage`.

#### [NEW] [supabase-cms.repository.ts](file:///d:/win-dia/src/backend/repositories/supabase/supabase-cms.repository.ts)
- `SupabaseContactMessageRepository`: `contact_messages` table CRUD.
- `SupabaseSettingsRepository`: `settings` table CRUD, `getByKey`, `setByKey`.
- `SupabasePageContentRepository`: `page_content` table CRUD, `findBySlug`.
- `SupabaseBannerRepository`: `banners` table CRUD, `findActive`.

---

### [Repository Interfaces Extension & Export]

#### [NEW] Additional interfaces in [src/backend/repositories/cms.repository.ts](file:///d:/win-dia/src/backend/repositories/cms.repository.ts)
Interfaces for `ContactMessageRepository`, `SettingsRepository`, `PageContentRepository`, `BannerRepository`.

#### [MODIFY] [src/backend/repositories/index.ts](file:///d:/win-dia/src/backend/repositories/index.ts)
Export all Supabase concrete repository implementations and container registration helpers.

---

### [Dependency Container Registration]

#### [MODIFY] [src/backend/providers/container.provider.ts](file:///d:/win-dia/src/backend/providers/container.provider.ts)
Add `RepositoryTokens` keys and `registerRepositories(container)` factory helper to wire concrete Supabase implementations into the `ServiceContainer`.

---

## Verification Plan

### Automated Type Checking
- Run `npx tsc --noEmit` from project root to ensure all Supabase queries, TypeScript signatures, and barrel exports compile cleanly with zero errors.

### Architecture Compliance
- Verify zero business logic, zero authorization checks, zero calculations, zero HTTP response formatting, and zero API route calls exist inside repositories.
- Confirm all methods return `Result<T, AppError>`.

important update!!!
Do not put repositories under repositories/supabase/. Since you're only using Supabase, the extra nesting doesn't add value. Keep them directly under src/backend/repositories/ (e.g., product.repository.ts, order.repository.ts). If you ever switch data sources, you can refactor then.

Don't include updateStock() in the repository. A repository should expose generic persistence operations. Stock changes are business rules that belong in InventoryService. Instead, repositories should provide methods like:

findVariantById()
updateVariant()
findVariantsByProductId()

Then the service decides how stock is updated. This keeps the repository free of business semantics.
