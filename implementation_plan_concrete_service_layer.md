changes to the plan:
1. Inventory reservation

I would not implement

reserveStock
releaseReservation

yet.

Your current schema doesn't include an inventory_reservations table.

Without one, "reservation" usually means just decrementing stock temporarily, which introduces race conditions.

Instead:

validateStock()
deductStockAfterSuccessfulPayment()
restoreStockAfterCancellation()

If you later introduce an inventory reservation table or Redis lock, then add reservation methods.

2. Refunds

I would postpone

refundPayment()

until after the admin panel exists.

It's not required for MVP production.

Keep the interface if you want, but don't spend implementation time on it now.

3. Checkout transactions

This is the important one.

The current plan says

create order → payment → reserve stock → shipment placeholder

I would explicitly require that CheckoutService becomes the single transaction coordinator.

For example:

CheckoutService

↓

OrderService

↓

PaymentService

↓

InventoryService

↓

ShipmentService

No other service should orchestrate checkout.

That keeps transaction boundaries clean.



# Implementation Plan: WIN-DIA Concrete Service Layer Implementation

This document details the implementation plan for the **Concrete Service Layer** inside `src/backend/services/`. All business logic, checkout orchestration, inventory reservation, coupon validations, Razorpay payment initiation & webhook signature verification, and domain status transitions will live exclusively within these concrete services.

## User Review Required

> [!IMPORTANT]
> **Strict Architecture Principles**:
> 1. **Pure Business Logic**: All calculations (prices, taxes, discounts, stock validation), workflows, and payment gateway calls live exclusively in services.
> 2. **Zero Direct Supabase Queries**: Services invoke Repositories via dependency injection (`ServiceContainer`). No Supabase client calls are made directly inside service classes.
> 3. **Framework Agnostic**: Services accept standard DTOs/primitives and return `Result<T, AppError>`. No HTTP `Request`/`Response` or Next.js objects are referenced in service code.
> 4. **No API Route Modifications Yet**: Only concrete service implementation files and container wiring will be created in this step.

## Open Questions

None. Requirements and business rules are derived from `DATABASE_ARCHITECTURE.md` and `audit_report.md`.

## Proposed Changes

We will create/update files under `src/backend/services/`:

### [Service Implementation Files]

#### [NEW/MODIFY] [auth.service.ts](file:///d:/win-dia/src/backend/services/auth.service.ts)
`AuthService` interface & `AuthServiceImpl` class:
- `login`, `register`, `logout`, `passwordReset`, `verifyEmail`, `validateSession`, `checkRole`.

#### [NEW/MODIFY] [user.service.ts](file:///d:/win-dia/src/backend/services/user.service.ts)
`UserService` interface & `UserServiceImpl` class:
- Profile management, address CRUD (`getUserAddresses`, `addAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`).

#### [NEW/MODIFY] [product.service.ts](file:///d:/win-dia/src/backend/services/product.service.ts)
`ProductService` interface & `ProductServiceImpl` class:
- Product catalogue browsing, text searching, status filtering, featured products, product details with variants/images.

#### [NEW] [category.service.ts](file:///d:/win-dia/src/backend/services/category.service.ts)
`CategoryService` interface & `CategoryServiceImpl` class:
- Tree hierarchy retrieval, slug resolution, root category listing.

#### [NEW/MODIFY] [cart.service.ts](file:///d:/win-dia/src/backend/services/cart.service.ts)
`CartService` interface & `CartServiceImpl` class:
- `addItem`, `updateQuantity`, `removeItem`, `clearCart`, `mergeGuestCart`, `calculateSubtotal`.

#### [NEW] [wishlist.service.ts](file:///d:/win-dia/src/backend/services/wishlist.service.ts)
`WishlistService` interface & `WishlistServiceImpl` class:
- Add item, remove item, list wishlist, move item from wishlist to cart.

#### [NEW] [inventory.service.ts](file:///d:/win-dia/src/backend/services/inventory.service.ts)
`InventoryService` interface & `InventoryServiceImpl` class:
- `validateStock`, `reserveStock`, `releaseReservation`, `deductStockAfterPayment`.

#### [NEW/MODIFY] [coupon.service.ts](file:///d:/win-dia/src/backend/services/coupon.service.ts)
`CouponService` interface & `CouponServiceImpl` class:
- `validateCoupon` (usage limits, expiration, min order total checks), `calculateDiscount`, `incrementUsage`.

#### [NEW] [checkout.service.ts](file:///d:/win-dia/src/backend/services/checkout.service.ts)
`CheckoutService` interface & `CheckoutServiceImpl` class (Orchestrator):
- Orchestrates checkout pipeline: customer address validation → inventory check → coupon validation → price/tax/shipping calculations → order & order_items creation → payment initiation → stock reservation → shipment placeholder creation.

#### [NEW/MODIFY] [order.service.ts](file:///d:/win-dia/src/backend/services/order.service.ts)
`OrderService` interface & `OrderServiceImpl` class:
- `createOrder`, `getOrders`, `getOrderDetails`, `updateOrderStatus` (with status transition check and `order_status_history` record), `cancelOrder`.

#### [NEW/MODIFY] [payment.service.ts](file:///d:/win-dia/src/backend/services/payment.service.ts)
`PaymentService` interface & `PaymentServiceImpl` class:
- `initiateRazorpayPayment`, `verifySignature`, `processSuccessfulPayment`, `processFailedPayment`, `logPaymentEvent`, `handleWebhook` (with HMAC signature verification and idempotency check), `refundPayment`.

#### [NEW/MODIFY] [shipment.service.ts](file:///d:/win-dia/src/backend/services/shipment.service.ts)
`ShipmentService` interface & `ShipmentServiceImpl` class:
- `createShipment`, `updateShipment`, `getTrackingTimeline`, `addTrackingEvent`.

#### [NEW/MODIFY] [review.service.ts](file:///d:/win-dia/src/backend/services/review.service.ts)
`ReviewService` interface & `ReviewServiceImpl` class:
- `submitReview`, `updateReview`, `deleteReview`, `approveReview`, `rejectReview`, `getAverageRating`.

#### [NEW] [contact.service.ts](file:///d:/win-dia/src/backend/services/contact.service.ts)
`ContactService` interface & `ContactServiceImpl` class:
- `submitMessage`, `updateStatus`, `listMessages`.

#### [NEW] [cms.service.ts](file:///d:/win-dia/src/backend/services/cms.service.ts)
`CMSService` interface & `CMSServiceImpl` class:
- `getBanners`, `getPageContent`.

#### [NEW] [settings.service.ts](file:///d:/win-dia/src/backend/services/settings.service.ts)
`SettingsService` interface & `SettingsServiceImpl` class:
- `getPublicSettings`, `getSettingByKey`, `updateSetting`.

#### [MODIFY] [src/backend/services/index.ts](file:///d:/win-dia/src/backend/services/index.ts)
Barrel export for all service contracts and implementations.

#### [MODIFY] [src/backend/providers/container.provider.ts](file:///d:/win-dia/src/backend/providers/container.provider.ts)
Add `ServiceTokens` and wire factories for all 16 service implementations in `ServiceContainer`.

---

## Verification Plan

### Type Checking & Compilation
- Run `npx tsc --noEmit` from project root to ensure all 16 service implementations compile cleanly with zero errors.

### Compliance Checks
- Verify zero Supabase client queries exist directly in services (only repository methods are called).
- Confirm zero HTTP/Next.js/React dependencies exist in `src/backend/services/`.
