import { BaseEntity, Nullable } from '../types/common.types';
import {
  AddressType,
  ContactMessageStatus,
  CouponType,
  OtpPurpose,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProductStatus,
  ReviewStatus,
  ShipmentStatus,
  ShippingStatus,
  UserRole,
} from '../enums/entity.enums';

export interface Profile extends BaseEntity {
  email: string;
  full_name: Nullable<string>;
  phone: Nullable<string>;
  avatar_url: Nullable<string>;
  role: UserRole;
}

export interface Address extends BaseEntity {
  user_id: string;
  address_line1: string;
  address_line2: Nullable<string>;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  address_type: AddressType;
}

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
  category_id: Nullable<string>;
  status: ProductStatus;
  is_featured: boolean;
  meta_title: Nullable<string>;
  meta_description: Nullable<string>;
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
  variant_id: string;
  quantity: number;
}

export interface Order extends BaseEntity {
  order_number: string;
  user_id: Nullable<string>;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_status: ShippingStatus;
  currency: string;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  coupon_code: Nullable<string>;
  shipping_address: Record<string, unknown>;
  billing_address: Record<string, unknown>;
  customer_notes: Nullable<string>;
  metadata: Record<string, unknown>;
}

export interface OrderItem extends BaseEntity {
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  price_snapshot: Record<string, unknown>;
}

export interface OrderStatusHistory extends BaseEntity {
  order_id: string;
  status: OrderStatus;
  notes: Nullable<string>;
  created_by: Nullable<string>;
}

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
  shipment_id: string;
  status: ShipmentStatus;
  location: Nullable<string>;
  description: Nullable<string>;
  event_timestamp: string;
}

export interface ProductReview extends BaseEntity {
  product_id: string;
  user_id: string;
  rating: number;
  title: Nullable<string>;
  comment: Nullable<string>;
  status: ReviewStatus;
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

export interface ContactMessage extends BaseEntity {
  name: string;
  email: string;
  subject: Nullable<string>;
  message: string;
  status: ContactMessageStatus;
}

export interface OtpVerification extends BaseEntity {
  phone_or_email: string;
  otp_code: string;
  purpose: OtpPurpose;
  expires_at: string;
  is_used: boolean;
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
