import { CouponType } from '../enums/entity.enums';

export interface BaseDTO {}

export interface PaginationQueryDTO extends BaseDTO {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAddressDTO extends BaseDTO {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
}

export interface UpdateProfileDTO extends BaseDTO {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface CreateProductDTO extends BaseDTO {
  name: string;
  description?: string;
  category_id?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface CreateVariantDTO extends BaseDTO {
  product_id: string;
  name: string;
  sku: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  stock_quantity: number;
  weight_grams?: number;
  attributes?: Record<string, unknown>;
}

export interface AddToCartDTO extends BaseDTO {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemDTO extends BaseDTO {
  quantity: number;
}

export interface CreateOrderDTO extends BaseDTO {
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  shipping_address_id: string;
  coupon_code?: string;
  order_notes?: string;
}

export interface CreateReviewDTO extends BaseDTO {
  product_id: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface ApplyCouponDTO extends BaseDTO {
  code: string;
  cart_total: number;
}

export interface CreateCouponDTO extends BaseDTO {
  code: string;
  description?: string;
  discount_type: CouponType;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  starts_at?: string;
  expires_at?: string;
}
