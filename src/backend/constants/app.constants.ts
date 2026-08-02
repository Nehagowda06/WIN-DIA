/**
 * Application Constants and Defaults
 */

export const PaginationDefaults = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

export const AppDefaults = {
  DEFAULT_CURRENCY: 'INR',
  ORDER_NUMBER_PREFIX: 'WD-',
  SKU_PREFIX: 'WD-SKU-',
  MAX_LOGIN_ATTEMPTS: 5,
  OTP_EXPIRATION_MINUTES: 10,
} as const;

export const RegexPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_INDIA: /^[6-9]\d{9}$/,
  PINCODE_INDIA: /^[1-9][0-9]{5}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;
