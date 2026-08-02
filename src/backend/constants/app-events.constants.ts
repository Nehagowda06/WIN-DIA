/**
 * Centralized Domain Application Events
 */

export const AppEvents = {
  // User Events
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  PROFILE_UPDATED: 'profile.updated',

  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  ORDER_DELIVERED: 'order.delivered',

  // Payment Events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Inventory & Product Events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  STOCK_LOW: 'stock.low',
  STOCK_OUT: 'stock.out',

  // Shipment Events
  SHIPMENT_CREATED: 'shipment.created',
  SHIPMENT_MANIFESTED: 'shipment.manifested',
  SHIPMENT_IN_TRANSIT: 'shipment.in_transit',
  SHIPMENT_OUT_FOR_DELIVERY: 'shipment.out_for_delivery',
  SHIPMENT_DELIVERED: 'shipment.delivered',
  SHIPMENT_FAILED: 'shipment.failed',

  // Customer Engagement Events
  REVIEW_SUBMITTED: 'review.submitted',
  REVIEW_APPROVED: 'review.approved',
  COUPON_APPLIED: 'coupon.applied',
} as const;

export type AppEvent = typeof AppEvents[keyof typeof AppEvents];
