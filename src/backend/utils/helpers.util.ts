import { AppDefaults } from '../constants/app.constants';

/**
 * Generates a unique order number (e.g. WD-20260802-A9F321)
 */
export function generateOrderNumber(prefix: string = AppDefaults.ORDER_NUMBER_PREFIX): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${dateStr}-${randomSuffix}`;
}

/**
 * Formats monetary amounts (e.g., 1499.50 -> ₹1,499.50)
 */
export function formatCurrency(amount: number, currency: string = AppDefaults.DEFAULT_CURRENCY, locale: string = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Converts text into URL-safe slug (e.g. "Garlic Thins 100g" -> "garlic-thins-100g")
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Generates SKU for product variants (e.g., WD-SKU-GARLIC-THINS-100G-A8F)
 */
export function generateSKU(productName: string, variantName?: string, prefix: string = AppDefaults.SKU_PREFIX): string {
  const cleanProd = slugify(productName).toUpperCase().slice(0, 15);
  const cleanVar = variantName ? slugify(variantName).toUpperCase().slice(0, 10) : '';
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();

  const parts = [prefix.replace(/-$/, ''), cleanProd];
  if (cleanVar) parts.push(cleanVar);
  parts.push(rand);

  return parts.join('-');
}

/**
 * Masks email address for security logging/display
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***.com';
  const maskedLocal = local.length <= 2 ? `${local[0]}*` : `${local[0]}***${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Masks phone number for security logging/display
 */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return '******';
  return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
}
