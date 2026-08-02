/**
 * Shared Entity Enums (Const Objects with derived literal types)
 * Strictly aligned with DATABASE_ARCHITECTURE.md database schema
 */

export const UserRole = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const AddressType = {
  SHIPPING: 'shipping',
  BILLING: 'billing',
  BOTH: 'both',
} as const;
export type AddressType = typeof AddressType[keyof typeof AddressType];

export const ProductStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;
export type ProductStatus = typeof ProductStatus[keyof typeof ProductStatus];

export const OrderStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const ShippingStatus = {
  UNFULFILLED: 'unfulfilled',
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
} as const;
export type ShippingStatus = typeof ShippingStatus[keyof typeof ShippingStatus];

export const PaymentProvider = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
  COD: 'cod',
} as const;
export type PaymentProvider = typeof PaymentProvider[keyof typeof PaymentProvider];

export const ShipmentStatus = {
  PENDING: 'pending',
  MANIFESTED: 'manifested',
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETURNED: 'returned',
} as const;
export type ShipmentStatus = typeof ShipmentStatus[keyof typeof ShipmentStatus];

export const ReviewStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type ReviewStatus = typeof ReviewStatus[keyof typeof ReviewStatus];

export const CouponType = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
} as const;
export type CouponType = typeof CouponType[keyof typeof CouponType];

export const OtpPurpose = {
  REGISTRATION: 'registration',
  PASSWORD_RESET: 'password_reset',
  LOGIN: 'login',
} as const;
export type OtpPurpose = typeof OtpPurpose[keyof typeof OtpPurpose];

export const ContactMessageStatus = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
} as const;
export type ContactMessageStatus = typeof ContactMessageStatus[keyof typeof ContactMessageStatus];
