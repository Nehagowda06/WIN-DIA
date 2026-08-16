/**
 * WIN-DIA Bundle Pricing Configuration
 * ─────────────────────────────────────
 * THIS IS THE SINGLE SOURCE OF TRUTH for all pricing/bundle logic.
 * Never duplicate these values in cart, checkout, admin, or frontend.
 *
 * Rule:
 *   - Customers cannot purchase single packets.
 *   - The only purchasable unit is a BUNDLE of 10 packets.
 *   - Price per packet: ₹64
 *   - Price per bundle: ₹640 (10 × ₹64)
 *   - Bonus: +2 free packets per bundle (customer pays for 10, receives 12)
 *   - Shipping: ALWAYS ₹0 (Free Delivery on every order)
 *   - This applies identically across ALL varieties/flavors.
 */

export const BundlePricing = {
  /** Number of packets the customer PAYS for per bundle */
  PACKETS_PER_BUNDLE: 10,

  /** Number of packets actually SHIPPED per bundle (includes free) */
  PACKETS_SHIPPED_PER_BUNDLE: 12,

  /** Price per individual packet in ₹ */
  PRICE_PER_PACKET: 64,

  /** Total price per bundle in ₹ (PACKETS_PER_BUNDLE × PRICE_PER_PACKET) */
  BUNDLE_PRICE: 640,

  /** Number of free bonus packets per bundle */
  FREE_PACKETS_PER_BUNDLE: 2,

  /** Shipping cost — always zero, free delivery on all orders */
  SHIPPING_COST: 0,

  /** Tax rate (GST) applied to taxable amount */
  TAX_RATE: 0.05,

  /** Minimum quantity: 1 bundle */
  MIN_BUNDLES: 1,

  /** Maximum bundles per order (stock-dependent, this is a sanity cap) */
  MAX_BUNDLES_PER_ITEM: 50,
} as const;

/**
 * Calculates pricing for a given number of bundles.
 * This function is the ONLY place bundle math should happen.
 *
 * @param bundles - Number of bundles ordered (must be >= 1)
 * @returns Pricing breakdown
 */
export function calculateBundlePricing(bundles: number) {
  const validBundles = Math.max(1, Math.floor(bundles));

  const packetsCharged = validBundles * BundlePricing.PACKETS_PER_BUNDLE;
  const packetsShipped = validBundles * BundlePricing.PACKETS_SHIPPED_PER_BUNDLE;
  const lineTotal = validBundles * BundlePricing.BUNDLE_PRICE;

  return {
    bundles: validBundles,
    packetsCharged,
    packetsShipped,
    unitPrice: BundlePricing.BUNDLE_PRICE,
    lineTotal,
  };
}

/**
 * Calculates the full order pricing given line items and optional discount.
 *
 * @param itemsSubtotal - Sum of all line totals (bundles × BUNDLE_PRICE)
 * @param discountAmount - Coupon discount in ₹ (already validated)
 * @returns Full pricing object for the order
 */
export function calculateOrderTotal(itemsSubtotal: number, discountAmount: number = 0) {
  const shipping = BundlePricing.SHIPPING_COST; // Always 0
  const taxableAmount = Math.max(0, itemsSubtotal - discountAmount);
  const tax = Math.round(taxableAmount * BundlePricing.TAX_RATE * 100) / 100;
  const total = Math.round((taxableAmount + tax + shipping) * 100) / 100;

  return {
    subtotal: itemsSubtotal,
    discount: discountAmount,
    tax,
    shipping,
    total,
  };
}
