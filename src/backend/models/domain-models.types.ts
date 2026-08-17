import { BaseEntity, Nullable } from '../types/common.types';
import {
  ContactMessageStatus,
  CouponType,
  OtpPurpose,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ReviewStatus,
  ShipmentStatus,
  UserRole,
} from '../enums/entity.enums';

// ── Users & Access ───────────────────────────────────────────────────────────

export interface Profile extends BaseEntity {
  email: string;
  full_name: Nullable<string>;
  phone: Nullable<string>;
  avatar_url: Nullable<string>;
  role: UserRole;
}

export interface Address extends BaseEntity {
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: Nullable<string>;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface LoginAttempt extends BaseEntity {
  email: string;
  ip_address: Nullable<string>;
  user_agent: Nullable<string>;
  is_successful: boolean;
}

export interface AdminSession extends BaseEntity {
  user_id: string;
  token_hash: string;
  ip_address: Nullable<string>;
  expires_at: string;
}

export interface OtpVerification extends BaseEntity {
  phone_or_email: string;
  otp_code: string;
  purpose: OtpPurpose;
  expires_at: string;
  is_used: boolean;
}

// ── Catalog ──────────────────────────────────────────────────────────────────

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description: Nullable<string>;
  parent_id: Nullable<string>;
  image_url: Nullable<string>;
  is_active: boolean;
}

export interface Product extends BaseEntity {
  name: string;
  slug: string;
  description: Nullable<string>;
  short_description: Nullable<string>;
  category_id: Nullable<string>;
  price: number;
  original_price: Nullable<number>;
  image: Nullable<string>;
  image_url: Nullable<string>;
  flavor: Nullable<string>;
  count_in_stock: number;
  is_low_gi: boolean;
  is_gluten_free: boolean;
  is_vegan: boolean;
  gi_value: Nullable<number>;
  net_weight: Nullable<string>;
  is_active: boolean;
  is_featured: boolean;
  sku: Nullable<string>;
}

export interface ProductVariant extends BaseEntity {
  product_id: string;
  name: string;
  sku: string;
  price: number;
  compare_at_price: Nullable<number>;
  cost_price: Nullable<number>;
  stock_quantity: number;
  weight_grams: Nullable<number>;
  attributes: Record<string, unknown>;
  is_active: boolean;
}

export interface ProductImage extends BaseEntity {
  product_id: string;
  variant_id: Nullable<string>;
  image_url: string;
  alt_text: Nullable<string>;
  display_order: number;
  is_primary: boolean;
}

export interface ProductReview extends BaseEntity {
  product_id: string;
  user_id: string;
  rating: number;
  title: Nullable<string>;
  comment: Nullable<string>;
  status: ReviewStatus;
}

// ── Cart & Wishlist ──────────────────────────────────────────────────────────

export interface Wishlist extends BaseEntity {
  user_id: string;
  product_id: string;
}

export interface Cart extends BaseEntity {
  user_id: Nullable<string>;
  session_id: Nullable<string>;
}

export interface CartItem extends BaseEntity {
  cart_id: string;
  product_id: string;
  quantity: number;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export interface Order extends BaseEntity {
  order_number: string;
  user_id: Nullable<string>;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: Nullable<string>;
  items_price: number;
  discount_price: number;
  tax_price: number;
  shipping_price: number;
  total_price: number;
  shipping_address: Record<string, unknown>;
  order_notes: Nullable<string>;
  razorpay_order_id: Nullable<string>;
  razorpay_payment_id: Nullable<string>;
  awb_code: Nullable<string>;
  courier_name: Nullable<string>;
  shipping_provider: Nullable<string>;
  delivered_at: Nullable<string>;
}

export interface OrderItem extends BaseEntity {
  order_id: string;
  product_id: string;
  name: string;
  price: number;
  qty: number;
  flavor: string | null;
  net_weight_grams: number | null;
  image: string | null;
}

export interface OrderStatusHistory extends BaseEntity {
  order_id: string;
  status: OrderStatus;
  notes: Nullable<string>;
  created_by: Nullable<string>;
}

export interface Coupon extends BaseEntity {
  code: string;
  description: Nullable<string>;
  discount_type: CouponType;
  discount_value: number;
  min_order_amount: Nullable<number>;
  max_discount_amount: Nullable<number>;
  usage_limit: Nullable<number>;
  used_count: number;
  starts_at: Nullable<string>;
  expires_at: Nullable<string>;
  is_active: boolean;
}

// ── Payments ─────────────────────────────────────────────────────────────────

export interface Payment extends BaseEntity {
  order_id: string;
  payment_provider: PaymentProvider;
  transaction_id: Nullable<string>;
  provider_order_id: Nullable<string>;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: Nullable<string>;
  raw_response: Nullable<Record<string, unknown>>;
}

export interface PaymentEvent extends BaseEntity {
  payment_id: string;
  event_type: string;
  payload: Record<string, unknown>;
}

// ── Shipping ─────────────────────────────────────────────────────────────────

export interface Shipment extends BaseEntity {
  order_id: string;
  courier_name: Nullable<string>;
  tracking_number: Nullable<string>;
  shipping_label_url: Nullable<string>;
  status: ShipmentStatus;
  shipped_at: Nullable<string>;
  delivered_at: Nullable<string>;
}

export interface ShipmentTrackingEvent extends BaseEntity {
  order_id: string;
  status: ShipmentStatus;
}

// ── Support & Content ────────────────────────────────────────────────────────

export interface ContactMessage extends BaseEntity {
  name: string;
  email: string;
  subject: Nullable<string>;
  message: string;
  status: ContactMessageStatus;
}

export interface Setting extends BaseEntity {
  key: string;
  value: Record<string, unknown>;
  description: Nullable<string>;
}

export interface PageContent extends BaseEntity {
  slug: string;
  title: string;
  content: string;
  metadata: Nullable<Record<string, unknown>>;
}

export interface Banner extends BaseEntity {
  title: string;
  image_url: string;
  link_url: Nullable<string>;
  display_order: number;
  is_active: boolean;
}