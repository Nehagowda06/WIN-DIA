import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError, ValidationError } from '../errors/domain-errors';
import { Order, OrderItem, Payment, Shipment } from '../models/domain-models.types';
import { OrderStatus } from '../enums/entity.enums';
import { CreateOrderDTO } from '../types/dto.types';
import { UserService } from './user.service';
import { CartService } from './cart.service';
import { InventoryService } from './inventory.service';
import { CouponService } from './coupon.service';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';
import { ShipmentService } from './shipment.service';
import { ProductRepository } from '../repositories/product.repository';
import { OrderRepository } from '../repositories/order.repository';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens, ServiceTokens } from '../providers/container.provider';
import { BundlePricing, calculateOrderBundlePricing, calculateOrderTotal } from '../constants/bundle-pricing.constants';
import { parseComboSelections } from '../constants/combo-flavors.constants';
import { autoBookShipment } from './auto-shipment.util';
import { sendOrderConfirmationEmail, sendAdminNewOrderAlert } from '../lib/email.js';

export interface CheckoutResult {
  order: Order;
  items: OrderItem[];
  payment: Payment;
  razorpayOrderId: string;
  shipment: Shipment;
  pricing: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    regularSubtotal?: number;
    bundleDiscount?: number;
    bonusPackets?: number;
    totalBundles?: number;
  };
}

export interface CheckoutService {
  processCheckout(userId: string | null, dto: CreateOrderDTO): Promise<Result<CheckoutResult, AppError>>;
}

interface PreparedOrderItems {
  preparedOrderItems: Record<string, unknown>[];
  /** Final payable subtotal after the order-wide bundle discount */
  subtotal: number;
  /** Full pre-discount regular price (bundles × ₹384) */
  regularSubtotal: number;
  /** Order-wide bundle discount (₹0, ₹128, ₹192 or ₹256 for 1–4 bundles) */
  bundleDiscount: number;
  /**
   * Offer wording only (0, 2, 3 or 4 for 1–4 bundles): the discount is
   * described as "free packets". The customer still receives exactly 6 packets
   * per bundle, so this is NOT extra stock or extra weight.
   */
  bonusPackets: number;
  totalBundles: number;
}

interface CouponOutcome {
  discount: number;
  validatedCouponId: string | null;
}

interface OrderCreationOutcome {
  createdOrder: Order;
  createdPayment: Payment;
  createdShipment: Shipment;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * The four products that hold the real flavour stock (in packets), keyed by
 * slug. Combos have no stock of their own: they draw from these four.
 * Keep in sync with the database stock functions.
 */
const FLAVOUR_PRODUCTS: Record<string, string> = {
  'curry-leaves-thins': 'Curry Leaves',
  'garlic-thins': 'Garlic',
  'jeera-thins': 'Jeera',
  'onion-thins': 'Onion',
};

/** The minimum shape the per-flavour stock check needs from an order line. */
interface FlavourStockLine {
  productSlug: string;
  bundles: number;
  comboSelections: Record<string, number> | null;
}

export class CheckoutServiceImpl implements CheckoutService {
  private userService: UserService;
  private cartService: CartService;
  private productRepo: ProductRepository;
  private orderRepo: OrderRepository;
  private inventoryService: InventoryService;
  private couponService: CouponService;
  private orderService: OrderService;
  private paymentService: PaymentService;
  private shipmentService: ShipmentService;

  constructor(
    userService?: UserService,
    cartService?: CartService,
    productRepo?: ProductRepository,
    orderRepo?: OrderRepository,
    inventoryService?: InventoryService,
    couponService?: CouponService,
    orderService?: OrderService,
    paymentService?: PaymentService,
    shipmentService?: ShipmentService
  ) {
    this.userService = userService || container.resolve<UserService>(ServiceTokens.UserService);
    this.cartService = cartService || container.resolve<CartService>(ServiceTokens.CartService);
    this.productRepo = productRepo || container.resolve<ProductRepository>(RepositoryTokens.ProductRepository);
    this.orderRepo = orderRepo || container.resolve<OrderRepository>(RepositoryTokens.OrderRepository);
    this.inventoryService = inventoryService || container.resolve<InventoryService>(ServiceTokens.InventoryService);
    this.couponService = couponService || container.resolve<CouponService>(ServiceTokens.CouponService);
    this.orderService = orderService || container.resolve<OrderService>(ServiceTokens.OrderService);
    this.paymentService = paymentService || container.resolve<PaymentService>(ServiceTokens.PaymentService);
    this.shipmentService = shipmentService || container.resolve<ShipmentService>(ServiceTokens.ShipmentService);
  }

  /**
   * STEP 2: ADDRESS_LOOKUP — resolves the shipping address either from the
   * inline payload or by looking up the user's saved addresses.
   */
  private async resolveShippingAddress(userId: string | null, dto: CreateOrderDTO): Promise<Result<any, AppError>> {
    const step2Start = Date.now();
    console.log(`[TRACE STEP 2: ADDRESS_LOOKUP] Checking address payload or user addresses`);
    let selectedAddress: any = null;
    const rawAddr = (dto as any).shippingAddress || (dto as any).shipping_address;

    if (rawAddr) {
      selectedAddress = {
        full_name: rawAddr.name || rawAddr.full_name || 'Valued Customer',
        phone: String(rawAddr.phone || ''),
        address_line1: rawAddr.street || rawAddr.address_line1 || '',
        address_line2: rawAddr.address_line2 || null,
        city: rawAddr.city || '',
        state: rawAddr.state || '',
        pincode: String(rawAddr.pincode || rawAddr.postal_code || ''),
        country: rawAddr.country || 'India',
        email: rawAddr.email || (dto as any).customer_email || (dto as any).email || null,
      };
      console.log(`[TRACE STEP 2: ADDRESS_LOOKUP] Used inline address payload:`, selectedAddress);
    } else if (userId) {
      console.log(`[TRACE STEP 2: ADDRESS_LOOKUP] Calling UserService.getUserAddresses for userId: ${userId}`);
      const addrRes = await this.userService.getUserAddresses(userId);
      if (addrRes.success && addrRes.value.length > 0) {
        selectedAddress = addrRes.value.find((a) => a.id === (dto as any).shipping_address_id) || addrRes.value[0];
        console.log(`[TRACE STEP 2: ADDRESS_LOOKUP] Found address in DB:`, selectedAddress);
      }
    }
    const step2Time = Date.now() - step2Start;

    if (!selectedAddress || !selectedAddress.address_line1 || !selectedAddress.city) {
      console.log(`[TRACE STEP 2: ADDRESS_LOOKUP] FAILURE | Time: ${step2Time}ms | Error: Valid shipping address is required`);
      return failure(new ValidationError('Valid shipping address is required for checkout'));
    }
    console.log(`[TRACE STEP 2: ADDRESS_LOOKUP] SUCCESS | Time: ${step2Time}ms`);
    return success(selectedAddress);
  }

  /**
   * STEP 3: CART_LOOKUP — resolves the items to check out, either from the
   * request payload or by falling back to the user's cart.
   */
  private async resolveCartItems(userId: string | null, dto: CreateOrderDTO): Promise<Result<any[], AppError>> {
    const step3Start = Date.now();
    console.log(`[TRACE STEP 3: CART_LOOKUP] Resolving items from request dto or CartService`);
    let rawItems: any[] = (dto as any).items || [];
    if (!rawItems || rawItems.length === 0) {
      // Only load cart for authenticated users
      if (userId) {
        console.log(`[TRACE STEP 3: CART_LOOKUP] Calling CartService.getCart for userId: ${userId}`);
        const cartRes = await this.cartService.getCart(userId);
        if (cartRes.success && cartRes.value.items) {
          rawItems = cartRes.value.items;
        }
      }
    }
    const step3Time = Date.now() - step3Start;

    if (!rawItems || rawItems.length === 0) {
      console.log(`[TRACE STEP 3: CART_LOOKUP] FAILURE | Time: ${step3Time}ms | Error: Cart is empty`);
      return failure(new ValidationError('Cart is empty. Cannot process checkout.'));
    }
    console.log(`[TRACE STEP 3: CART_LOOKUP] SUCCESS | Time: ${step3Time}ms | Items Count: ${rawItems.length}`, rawItems);
    return success(rawItems);
  }

  /**
   * Resolves a raw cart-item product reference (UUID, slug, or flavor/name)
   * to a real product ID already in the database. Does NOT fabricate an ID
   * or create a placeholder product when nothing matches — that would inject
   * phantom inventory into the real DB. Instead the checkout is rejected so
   * the underlying catalog mismatch gets fixed.
   */
  private async resolveProductId(rawId: string, item: any): Promise<Result<string, AppError>> {
    if (UUID_PATTERN.test(rawId)) {
      // Frontend sent a real UUID — existence is verified by the caller.
      return success(rawId);
    }

    // Frontend sent a slug-based ID (e.g., "gluten-free-jeera" or "jeera-thins")
    // Strategy 1: try resolving by slug variants.
    const slugVariants = [
      rawId,
      rawId.replace(/^(gluten-free|everyday)-/, ''),
      `${rawId}-thins`,
      rawId.replace(/^(gluten-free|everyday)-/, '') + '-thins',
    ];

    for (const slug of slugVariants) {
      const slugRes = await this.productRepo.findBySlug(slug);
      if (slugRes.success && slugRes.value) {
        console.log(`[CheckoutService] Resolved product "${rawId}" via slug "${slug}" → ${slugRes.value.id} (${slugRes.value.name})`);
        return success(slugRes.value.id);
      }
    }

    // Strategy 2: search by flavor/name.
    const flavor = item.flavor || item.flavour ||
      rawId.replace(/^(gluten-free|everyday)-/, '').replace(/-thins$/, '').replace(/-/g, ' ');
    const itemName = item.name || '';

    const allProducts = await this.productRepo.findAll({ is_active: true });
    if (allProducts.success && allProducts.value.length > 0) {
      const resolvedProduct = allProducts.value.find((p) => {
        const pFlavor = (p.flavor || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const pSlug = (p.slug || '').toLowerCase();
        const searchFlavor = flavor.toLowerCase();
        const searchName = itemName.toLowerCase().replace(' flavour', '').replace(' flavor', '').trim();

        return pFlavor === searchFlavor ||
               pFlavor.includes(searchFlavor) ||
               searchFlavor.includes(pFlavor) ||
               pName.includes(searchFlavor) ||
               pSlug.includes(searchFlavor) ||
               (searchName && pName.includes(searchName)) ||
               (searchName && pFlavor.includes(searchName)) ||
               (searchName && pSlug.includes(searchName));
      });

      if (resolvedProduct) {
        console.log(`[CheckoutService] Resolved product "${rawId}" via flavor/name → ${resolvedProduct.id} (${resolvedProduct.name}, stock: ${resolvedProduct.count_in_stock})`);
        return success(resolvedProduct.id);
      }
    }

    // Could not resolve this item to a real, pre-seeded product.
    // Do NOT fabricate a UUID or auto-create a placeholder product with fake
    // stock — that would inject phantom inventory into the real DB.
    console.error(`[CheckoutService] Could not resolve product for ID "${rawId}". Rejecting checkout.`);
    return failure(new NotFoundError(
      `Product "${item.name || rawId}" could not be found. Please refresh and try again.`
    ));
  }

  /**
   * STEP 4: ORDER_PAYLOAD_CREATION & STOCK_VALIDATION (BUNDLE PRICING ENFORCED)
   * Maps raw cart items to order-item snapshots, resolving real product IDs
   * (UUID → slug → flavor/name — rejecting the checkout if none match),
   * enforcing server-side bundle pricing (tiered across the WHOLE order),
   * validating combo selections, and validating stock per product.
   */
  private async prepareOrderItems(rawItems: any[]): Promise<Result<PreparedOrderItems, AppError>> {
    const step4Start = Date.now();
    console.log(`[TRACE STEP 4: ORDER_PAYLOAD_CREATION & STOCK_VALIDATION] Mapping items to order snapshots with BUNDLE PRICING`);

    interface LineDraft {
      productId: string;
      productName: string;
      productSlug: string;
      bundles: number;
      displayName: string;
      image: string | null;
      weightPerBundle: number;
      flavor: string | null;
      /** Validated flavour choices for ONE combo (canonical labels), or null for non-combo lines */
      comboSelections: Record<string, number> | null;
    }
    const drafts: LineDraft[] = [];
    const productsById = new Map<string, { name: string; stock: number }>();

    for (const item of rawItems) {
      // qty from frontend represents number of BUNDLES (enforced by frontend selector)
      const bundles = Math.max(BundlePricing.MIN_BUNDLES, Math.min(BundlePricing.MAX_BUNDLES_PER_ITEM, Math.floor(parseInt(item.qty || item.quantity) || 1)));

      const rawId = item.productId || item.product_id || item.id || item._id;
      const validProductIdRes = await this.resolveProductId(rawId, item);
      if (!validProductIdRes.success) return failure(validProductIdRes.error);
      const validProductId = validProductIdRes.value;

      // Verify the resolved product actually exists in the DB before proceeding.
      // If it doesn't, reject rather than silently creating a placeholder with fake stock.
      const prodExistsCheck = await this.productRepo.findById(validProductId);
      if (!prodExistsCheck.success || !prodExistsCheck.value) {
        console.error(`[CheckoutService] Product ${validProductId} not found in DB for item "${item.name}". Rejecting checkout.`);
        return failure(new NotFoundError(
          `Product "${item.name || rawId}" is not available. Please refresh and try again.`
        ));
      }

      // SECURITY: Fetch authoritative product weight from database, ignore frontend-submitted weight
      const catalogProduct = prodExistsCheck.value;
      const catalogWeight = catalogProduct.net_weight; // e.g., "240g" from products table

      let weightPerBundle: number;
      if (typeof catalogWeight === 'string') {
        const parsed = parseInt(catalogWeight.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) {
          weightPerBundle = parsed;
        } else {
          console.error(`[CheckoutService] ERROR: Product "${catalogProduct.name}" has invalid net_weight in database: "${catalogWeight}"`);
          return failure(new ValidationError(
            `Product "${catalogProduct.name}" has invalid weight configuration. Please contact support.`
          ));
        }
      } else if (typeof catalogWeight === 'number' && catalogWeight > 0) {
        weightPerBundle = catalogWeight;
      } else {
        console.error(`[CheckoutService] ERROR: Product "${catalogProduct.name}" has no weight in database!`);
        return failure(new ValidationError(
          `Product "${catalogProduct.name}" is missing weight configuration. Please contact support.`
        ));
      }

      // Combo lines: validate the chosen flavours, record a readable summary on
      // the order item, and keep the structured selections so they can be saved
      // to order_combo_selections (needed for per-flavour stock deduction).
      let flavor: string | null = item.flavor || null;
      let comboSelections: Record<string, number> | null = null;
      if (item.flavorSelections) {
        const combo = parseComboSelections(item.flavorSelections);
        if (!combo.ok) {
          return failure(new ValidationError(`${item.name || 'Combo'}: ${combo.reason}`));
        }
        if (catalogProduct.is_active === false) {
          return failure(new ValidationError(`${item.name || 'Combo'} is currently unavailable.`));
        }
        flavor = combo.summary ?? null;
        comboSelections = combo.selections ?? null;
      }

      productsById.set(validProductId, {
        name: item.name || catalogProduct.name || 'product',
        stock: Number(catalogProduct.count_in_stock) || 0,
      });
      drafts.push({
        productId: validProductId,
        productName: item.name || catalogProduct.name || 'product',
        productSlug: String(catalogProduct.slug || ''),
        bundles,
        displayName: item.name || item.product_name || 'WIN-DIA Product',
        image: item.image || item.image_url || null,
        weightPerBundle,
        flavor,
        comboSelections,
      });
    }

    // SERVER-SIDE PRICE ENFORCEMENT: Never trust frontend-sent price.
    // The exact offer is determined ONCE from the total bundle count across the
    // whole order, so the discount is never recalculated per flavour.
    // Quantities above four preserve the legacy behaviour.
    const orderPricing = calculateOrderBundlePricing(drafts.map((d) => d.bundles));
    const subtotal = orderPricing.subtotal;

    // Stock validation, in packets, summed per product. The customer receives
    // exactly 6 packets per bundle: the offer's "bonus packets" are only how
    // the discount is worded (e.g. 2 bundles = pay for 10 packets, receive 12),
    // so nothing extra is shipped or deducted.
    // Several lines can point at the same product (e.g. combos with different
    // flavour selections), so each line passing alone is not enough.
    // Combo lines are skipped here: a combo is only a container whose packets
    // come from the four flavour products, so they are checked per flavour by
    // validateFlavourStock below (the database re-checks at deduction time).
    const packetsByProduct = new Map<string, number>();
    for (const d of drafts) {
      if (d.comboSelections) continue;
      const packets = d.bundles * BundlePricing.PACKETS_SHIPPED_PER_BUNDLE;
      packetsByProduct.set(d.productId, (packetsByProduct.get(d.productId) || 0) + packets);
    }
    for (const [productId, packetsNeeded] of packetsByProduct) {
      console.log(`[TRACE STEP 4: STOCK_VALIDATION] Calling InventoryService.validateStock for productId: ${productId}, packets: ${packetsNeeded}`);
      const stockRes = await this.inventoryService.validateStock(productId, packetsNeeded);
      if (!stockRes.success) {
        const info = productsById.get(productId);
        console.log(`[TRACE STEP 4: STOCK_VALIDATION] Insufficient stock for productId=${productId}:`, stockRes.error);
        const bundlesNeeded = Math.round(packetsNeeded / BundlePricing.PACKETS_SHIPPED_PER_BUNDLE);
        return failure(new ValidationError(
          `Insufficient stock for "${info?.name || 'product'}". You ordered ${bundlesNeeded} bundle(s) (${packetsNeeded} packets) ` +
          `but only ${info?.stock ?? 0} packet(s) are in stock.`
        ));
      }
    }

    // Combos and plain flavour bundles all draw from the same four flavour
    // products, so check them together BEFORE the customer is sent to pay.
    const flavourCheck = await this.validateFlavourStock(drafts);
    if (!flavourCheck.success) return failure(flavourCheck.error);

    const preparedOrderItems: Record<string, unknown>[] = drafts.map((d) => ({
      product_id: d.productId,
      name: d.displayName,
      // Per-bundle price is always the regular ₹384. The order-wide bundle
      // discount is recorded separately on the order (never folded into or
      // trusted from a client-submitted price).
      price: BundlePricing.BUNDLE_PRICE,
      // qty = number of bundles ordered (one combo = one bundle = 6 packets)
      qty: d.bundles,
      flavor: d.flavor,
      // Structured flavour choices for ONE combo (null for non-combo lines).
      // Not an order_items column: the repository saves it to
      // order_combo_selections, once per combo.
      combo_selections: d.comboSelections,
      // CRITICAL: Store weight PER BUNDLE (not total line weight).
      // DTDC multiplies this by qty. The customer receives exactly 6 packets
      // per bundle, so there is no extra weight for the offer's "bonus" wording.
      net_weight_grams: d.weightPerBundle,
      image: d.image,
    }));

    const step4Time = Date.now() - step4Start;
    console.log(
      `[TRACE STEP 4: ORDER_PAYLOAD_CREATION] SUCCESS | Time: ${step4Time}ms | ` +
      `Regular: ${orderPricing.regularPrice} | Bundle discount: ${orderPricing.discount} | ` +
      `Final subtotal: ${subtotal} | Offer free-packet wording: ${orderPricing.bonusPackets}`,
      preparedOrderItems
    );

    return success({
      preparedOrderItems,
      subtotal,
      regularSubtotal: orderPricing.regularPrice,
      bundleDiscount: orderPricing.discount,
      bonusPackets: orderPricing.bonusPackets,
      totalBundles: orderPricing.totalBundles,
    });
  }

  /**
   * Checks the whole order against the four flavour products, using the same
   * rules as the database stock functions so a customer is never sent to pay
   * for something that cannot be fulfilled:
   *  - a flavour is "available" only if it is active and has at least one
   *    full bundle (6 packets) in stock;
   *  - every combo must contain every available flavour (compulsory) and
   *    nothing that is unavailable;
   *  - the total packets needed per flavour (combos plus plain bundles) must
   *    not exceed that flavour's stock.
   */
  private async validateFlavourStock(lines: FlavourStockLine[]): Promise<Result<boolean, AppError>> {
    const required: Record<string, number> = {};
    for (const line of lines) {
      if (line.comboSelections) {
        for (const [label, packets] of Object.entries(line.comboSelections)) {
          required[label] = (required[label] || 0) + packets * line.bundles;
        }
      } else if (FLAVOUR_PRODUCTS[line.productSlug]) {
        const label = FLAVOUR_PRODUCTS[line.productSlug];
        required[label] = (required[label] || 0) + line.bundles * BundlePricing.PACKETS_SHIPPED_PER_BUNDLE;
      }
    }
    if (Object.keys(required).length === 0) return success(true);

    const stock: Record<string, { active: boolean; count: number }> = {};
    for (const [slug, label] of Object.entries(FLAVOUR_PRODUCTS)) {
      const res = await this.productRepo.findBySlug(slug);
      if (!res.success || !res.value) {
        console.error(`[CheckoutService] Flavour product "${slug}" not found while checking stock`);
        return failure(new ValidationError('We could not check stock right now. Please try again in a moment.'));
      }
      stock[label] = {
        active: res.value.is_active === true,
        count: Number(res.value.count_in_stock) || 0,
      };
    }

    const available = Object.keys(stock).filter(
      (label) => stock[label].active && stock[label].count >= BundlePricing.PACKETS_PER_BUNDLE
    );

    for (const line of lines) {
      if (!line.comboSelections) continue;
      const chosen = Object.keys(line.comboSelections);

      const unavailable = chosen.filter((label) => !available.includes(label));
      if (unavailable.length > 0) {
        return failure(new ValidationError(
          `${unavailable.join(', ')} is currently out of stock. Please go back and choose your combo again.`
        ));
      }

      const missing = available.filter((label) => !chosen.includes(label));
      if (missing.length > 0) {
        return failure(new ValidationError(
          `Every available flavour must be in your combo. Please add: ${missing.join(', ')}.`
        ));
      }
    }

    for (const [label, packets] of Object.entries(required)) {
      const s = stock[label];
      if (!s.active) {
        return failure(new ValidationError(`${label} is currently unavailable.`));
      }
      if (s.count < packets) {
        return failure(new ValidationError(
          `Insufficient stock for ${label}. Your order needs ${packets} packets but only ${s.count} are available.`
        ));
      }
    }

    return success(true);
  }

  /**
   * STEP 5: COUPON_VALIDATION — applies a coupon code if provided, rejecting
   * checkout outright on an invalid/expired coupon rather than ignoring it.
   */
  private async applyCoupon(dto: CreateOrderDTO, subtotal: number): Promise<Result<CouponOutcome, AppError>> {
    const step5Start = Date.now();
    let discount = 0;
    let validatedCouponId: string | null = null;
    // Accept both snake_case and camelCase (the checkout page sends coupon_code)
    const couponCode = String(dto.coupon_code || (dto as { couponCode?: string }).couponCode || '').trim();
    if (couponCode) {
      console.log(`[TRACE STEP 5: COUPON_VALIDATION] Calling CouponService.calculateDiscount for code: ${couponCode}`);
      const couponRes = await this.couponService.calculateDiscount({
        code: couponCode,
        cart_total: subtotal,
      });
      if (couponRes.success) {
        discount = couponRes.value.discountAmount;
        validatedCouponId = couponRes.value.coupon.id;
        console.log(`[TRACE STEP 5: COUPON_VALIDATION] SUCCESS | Discount: ${discount}`);
      } else {
        // Invalid/expired coupon — reject checkout, do not silently ignore
        console.log(`[TRACE STEP 5: COUPON_VALIDATION] FAILURE | Error:`, couponRes.error);
        return failure(couponRes.error);
      }
    }
    const step5Time = Date.now() - step5Start;
    console.log(`[TRACE STEP 5: COUPON_VALIDATION] Finished | Time: ${step5Time}ms`);
    return success({ discount, validatedCouponId });
  }

  /**
   * STEP 7 (+ fallback / STEP 8): attempts the single-transaction RPC-style
   * checkout via OrderRepository, falling back to the standard step-by-step
   * repository/service calls if that transaction fails.
   */
  private async createOrder(
    userId: string | null,
    dto: CreateOrderDTO,
    selectedAddress: any,
    preparedOrderItems: Record<string, unknown>[],
    selectedPaymentMethod: string,
    pricing: { subtotal: number; discount: number; tax: number; shipping: number; total: number },
    pendingPaymentPlaceholderId: string
  ): Promise<Result<OrderCreationOutcome, AppError>> {
    const { subtotal, discount, tax, shipping, total } = pricing;


    const step7Start = Date.now();
    console.log(`[TRACE STEP 7: RPC_INVOCATION] Calling OrderRepository.createCheckoutTransaction RPC`);
    console.log(`RPC Params:`, {
      userId,
      orderData: { subtotal, discount, tax, shipping, total },
      itemsCount: preparedOrderItems.length,
      paymentData: { pendingPaymentPlaceholderId, total },
    });

    // Extract customer_email and customer_phone for guest orders
    const customerEmail = (dto as any).customer_email || (dto as any).email || selectedAddress.email || null;
    const customerPhone = selectedAddress.phone || null;
    const txRes = await this.orderRepo.createCheckoutTransaction(
      userId,
      {
        items_price: subtotal,
        discount_price: discount,
        tax_price: tax,
        shipping_price: shipping,
        total_price: total,
        order_status: OrderStatus.PLACED,
        payment_method: selectedPaymentMethod,
        shipping_address: selectedAddress,
        order_notes: dto.order_notes || (dto as any).orderNotes || null,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      preparedOrderItems,
      {
        payment_provider: 'razorpay',
        provider_order_id: pendingPaymentPlaceholderId,
        amount: total,
        currency: 'INR',
        status: 'pending',
        payment_method: selectedPaymentMethod,
      },
      {
        courier_name: 'DTDC',
        status: 'pending',
      }
    );
    const step7Time = Date.now() - step7Start;

    if (txRes.success && txRes.value && txRes.value.order) {
      console.log(`[TRACE STEP 7: RPC_INVOCATION] RPC SUCCESS | Time: ${step7Time}ms | Returned JSON:`, txRes.value);
      const createdOrder = txRes.value.order as Order;
      let createdPayment = txRes.value.payment as Payment;
      const createdShipment = txRes.value.shipment as Shipment;

      // Online payments are created after the order exists so Razorpay can
      // return a real provider order ID tied to this database order.
      if (!createdPayment && selectedPaymentMethod !== 'cod') {
        const payRes = await this.paymentService.initiateRazorpayPayment(
          createdOrder.id,
          total,
          createdOrder.order_number
        );
        if (!payRes.success) return failure(payRes.error);
        createdPayment = payRes.value.payment;
      }

      return success({ createdOrder, createdPayment, createdShipment });
    }

    console.log(`[TRACE STEP 7: RPC_INVOCATION] RPC FAILED | Time: ${step7Time}ms | Database Error:`, txRes.error);

    // The fallback below cannot save combo flavour selections, and an order
    // without them can never have its stock deducted (a Razorpay customer
    // could even pay for an order that cannot be confirmed). So combo orders
    // are never created through the fallback: report the failure instead.
    if (preparedOrderItems.some((i) => i.combo_selections)) {
      const comboErr: any = (txRes as any).error;
      return failure(
        comboErr ||
        new ValidationError('We could not place your order right now. Please try again in a moment or contact support.')
      );
    }

    console.log(`[TRACE STEP 7: FALLBACK] Initiating standard repository order creation fallback`);
    return this.createOrderFallback(userId, dto, selectedAddress, preparedOrderItems, selectedPaymentMethod, pricing);
  }

  /**
   * Fallback path used when the single-transaction RPC checkout fails:
   * creates the order, order items, Razorpay payment, and shipment placeholder
   * step by step via the individual services/repositories.
   * (Not used for combo orders: see createOrder.)
   */
  private async createOrderFallback(
    userId: string | null,
    dto: CreateOrderDTO,
    selectedAddress: any,
    preparedOrderItems: Record<string, unknown>[],
    selectedPaymentMethod: string,
    pricing: { subtotal: number; discount: number; tax: number; shipping: number; total: number }
  ): Promise<Result<OrderCreationOutcome, AppError>> {
    const { subtotal, discount, tax, shipping, total } = pricing;

    const customerEmail = (dto as any).customer_email || (dto as any).email || selectedAddress.email || null;
    const customerPhone = selectedAddress.phone || null;

    const orderRes = await this.orderService.createOrder(userId, {
      items_price: subtotal,
      discount_price: discount,
      tax_price: tax,
      shipping_price: shipping,
      total_price: total,
      order_status: OrderStatus.PLACED,
      payment_method: selectedPaymentMethod,
      shipping_address: selectedAddress as any,
      order_notes: dto.order_notes || (dto as any).orderNotes || null,
      customer_email: customerEmail,
      customer_phone: customerPhone,
    });

    if (!orderRes.success) {
      console.error(`[TRACE STEP 7: FALLBACK_ORDER_CREATE] FAILURE | Error:`, {
        name: orderRes.error.name,
        message: orderRes.error.message,
        stack: orderRes.error.stack,
        details: orderRes.error.details,
      });
      return failure(orderRes.error);
    }
    const createdOrder = orderRes.value;
    console.log(`[TRACE STEP 7: FALLBACK_ORDER_CREATE] SUCCESS | OrderId: ${createdOrder.id}`);

    const itemsRes = await this.orderService.createOrderItems(createdOrder.id, preparedOrderItems as any);
    if (!itemsRes.success) {
      console.error(`[TRACE STEP 7: FALLBACK_ORDER_ITEMS_CREATE] FAILURE | Error:`, {
        name: itemsRes.error.name,
        message: itemsRes.error.message,
        stack: itemsRes.error.stack,
        details: itemsRes.error.details,
      });
      return failure(itemsRes.error);
    }
    console.log(`[TRACE STEP 7: FALLBACK_ORDER_ITEMS_CREATE] SUCCESS`);

    // STEP 8: RAZORPAY_ORDER_CREATION
    const step8Start = Date.now();
    console.log(`[TRACE STEP 8: RAZORPAY_ORDER_CREATION] Calling PaymentService.initiateRazorpayPayment`);
    const payRes = await this.paymentService.initiateRazorpayPayment(createdOrder.id, total, createdOrder.order_number);
    const step8Time = Date.now() - step8Start;

    if (!payRes.success) {
      console.error(`[TRACE STEP 8: RAZORPAY_ORDER_CREATION] FAILURE | Time: ${step8Time}ms | Error:`, payRes.error);
      return failure(payRes.error);
    }
    const createdPayment = payRes.value.payment;
    console.log(`[TRACE STEP 8: RAZORPAY_ORDER_CREATION] SUCCESS | Time: ${step8Time}ms | RazorpayOrderId: ${payRes.value.razorpayOrderId}`);

    const shipRes = await this.shipmentService.createShipmentPlaceholder(createdOrder.id);
    if (!shipRes.success) {
      console.error(`[TRACE STEP 7: FALLBACK_SHIPMENT_CREATE] FAILURE | Error:`, shipRes.error);
      return failure(shipRes.error);
    }
    const createdShipment = shipRes.value;

    return success({ createdOrder, createdPayment, createdShipment });
  }

  /**
   * STEP 9: CLEAR_CART & INCREMENT COUPON USAGE
   */
  private async finalizeCartAndCoupon(userId: string, validatedCouponId: string | null): Promise<void> {
    const cartRes = await this.cartService.getCart(userId);
    if (cartRes.success && cartRes.value.cart) {
      await this.cartService.clearCart(cartRes.value.cart.id);
    }

    // Increment coupon usage count to prevent double-use
    if (validatedCouponId) {
      await this.couponService.incrementUsage(validatedCouponId);
    }
  }

  public async processCheckout(userId: string | null, dto: CreateOrderDTO): Promise<Result<CheckoutResult, AppError>> {
    console.log(`\n--- [CHECKOUT_SERVICE: ENTER] processCheckout for userId: ${userId} ---`);
    const startTime = Date.now();

    try {
      // STEP 1: VALIDATION
      const step1Start = Date.now();
      console.log(`[TRACE STEP 1: VALIDATION] Validating DTO payload:`, dto);
      // Guest checkout is allowed if customer_email is provided
      const isGuest = !userId;
      if (isGuest) {
        const email = (dto as any).customer_email || (dto as any).email;
        if (!email || typeof email !== 'string' || !email.trim()) {
          console.log(`[TRACE STEP 1: VALIDATION] FAILURE | Error: Email is required for guest checkout`);
          return failure(new ValidationError('Email is required for guest checkout'));
        }
      }
      const step1Time = Date.now() - step1Start;
      console.log(`[TRACE STEP 1: VALIDATION] SUCCESS | Time: ${step1Time}ms`);

      // STEP 2: ADDRESS_LOOKUP
      const addressRes = await this.resolveShippingAddress(userId, dto);
      if (!addressRes.success) return failure(addressRes.error);
      const selectedAddress = addressRes.value;

      // STEP 3: CART_LOOKUP
      const cartItemsRes = await this.resolveCartItems(userId, dto);
      if (!cartItemsRes.success) return failure(cartItemsRes.error);
      const rawItems = cartItemsRes.value;

      // STEP 4: ORDER_PAYLOAD_CREATION & STOCK_VALIDATION (BUNDLE PRICING ENFORCED)
      const preparedRes = await this.prepareOrderItems(rawItems);
      if (!preparedRes.success) return failure(preparedRes.error);
      const {
        preparedOrderItems,
        subtotal,
        regularSubtotal,
        bundleDiscount,
        bonusPackets,
        totalBundles,
      } = preparedRes.value;

      // STEP 5: COUPON_VALIDATION
      // Coupons apply to the final bundle-offer subtotal, not the regular price.
      const couponRes = await this.applyCoupon(dto, subtotal);
      if (!couponRes.success) return failure(couponRes.error);
      const { discount: couponDiscount, validatedCouponId } = couponRes.value;

      // STEP 6: PRICING_CALCULATION (SERVER-SIDE ONLY — FREE DELIVERY ENFORCED)
      // Shipping is ALWAYS ₹0. This is hardcoded and cannot be overridden by frontend.
      // The order stores the regular items price and the combined bundle + coupon
      // discount, so items_price − discount_price always equals the payable total.
      const totalDiscount = bundleDiscount + couponDiscount;
      const orderPricing = calculateOrderTotal(regularSubtotal, totalDiscount);
      const { shipping, tax, total } = orderPricing;
      console.log(
        `[TRACE STEP 6: PRICING_CALCULATION] Pricing (FREE DELIVERY enforced) | ` +
        `Bundles: ${totalBundles} | Offer free-packet wording: ${bonusPackets} | ` +
        `Bundle discount: ${bundleDiscount} | Coupon discount: ${couponDiscount}:`,
        orderPricing
      );

      // STEP 7 (+ fallback / STEP 8): ORDER_CREATION
      // Placeholder written to the initial order-creation transaction's payment row.
      // The repository only persists this for COD orders; for online payments the
      // REAL Razorpay provider_order_id is generated afterwards via
      // paymentService.initiateRazorpayPayment and overwrites createdPayment below.
      // This value must never be returned to the client as a real Razorpay order ID.
      const pendingPaymentPlaceholderId = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const selectedPaymentMethod = (dto as any).paymentMethod || (dto as any).payment_method || 'razorpay';

      const orderCreationRes = await this.createOrder(
        userId,
        dto,
        selectedAddress,
        preparedOrderItems,
        selectedPaymentMethod,
        orderPricing,
        pendingPaymentPlaceholderId
      );
      if (!orderCreationRes.success) return failure(orderCreationRes.error);
      const { createdOrder, createdPayment, createdShipment } = orderCreationRes.value;

      // COD orders have no payment step, so take the stock off right now.
      // This must run before the cart is cleared and before the DTDC booking.
      if (selectedPaymentMethod === 'cod') {
        const codStockRes = await this.inventoryService.deductStockForCodOrder(createdOrder.id);
        if (!codStockRes.success) {
          console.error(`[CheckoutService] COD stock deduction failed for order ${createdOrder.order_number}:`, codStockRes.error);
          const reason = String(codStockRes.error?.message || '');
          const isStockIssue = /insufficient stock|is unavailable|unavailable flavour/i.test(reason);
          return failure(new ValidationError(
            isStockIssue
              ? 'Some items in your cart just went out of stock. Please review your cart and try again.'
              : 'We could not place your order right now. Please try again in a moment or contact support.'
          ));
        }
      }

      // STEP 9: CLEAR_CART & INCREMENT COUPON USAGE
      // Only finalize cart/coupon for authenticated users
      if (userId) {
        await this.finalizeCartAndCoupon(userId, validatedCouponId);
      }

      // COD orders have no payment to wait for, so book the DTDC
      // shipment right away. Online (Razorpay) orders instead get booked
      // automatically once payment is confirmed — see autoBookShipment calls
      // in app/api/payment/verify and PaymentService.handleWebhook.
      console.log(`[CheckoutService] Payment method: ${selectedPaymentMethod}, Order ID: ${createdOrder.id}`);
      if (selectedPaymentMethod === 'cod') {
        console.log(`[CheckoutService] ✅ COD order detected - calling autoBookShipment for order ${createdOrder.order_number}`);
        await autoBookShipment(createdOrder.id, '[CheckoutService.processCheckout:COD]');
        console.log(`[CheckoutService] ✅ autoBookShipment call completed for order ${createdOrder.order_number}`);

        // Send customer confirmation email — non-fatal, must not interrupt checkout.
        const codCustomerEmail = createdOrder.customer_email;
        if (codCustomerEmail) {
          sendOrderConfirmationEmail(
            { ...createdOrder, order_items: preparedOrderItems },
            codCustomerEmail
          ).catch((err) =>
            console.error(`[CheckoutService] COD confirmation email failed for order ${createdOrder.order_number}:`, err?.message)
          );
        }

        // Send owner notification — non-fatal, must not interrupt checkout.
        sendAdminNewOrderAlert(
          { ...createdOrder, order_items: preparedOrderItems }
        ).catch((err) =>
          console.error(`[CheckoutService] COD admin alert failed for order ${createdOrder.order_number}:`, err?.message)
        );
      } else {
        console.log(`[CheckoutService] ⏭️ Skipping auto-shipment for online payment (will trigger after payment confirmation)`);
      }

      const totalProcessTime = Date.now() - startTime;
      console.log(`--- [CHECKOUT_SERVICE: EXIT_SUCCESS] Total Time: ${totalProcessTime}ms | OrderNumber: ${createdOrder.order_number} ---\n`);

      // For online payments, createdPayment must carry a REAL Razorpay provider_order_id
      // (set either by the RPC's payment row or by paymentService.initiateRazorpayPayment
      // above). Never fall back to the internal placeholder ID here — returning it to the
      // client would produce a Razorpay checkout call with a bogus order id.
      if (selectedPaymentMethod !== 'cod' && !createdPayment?.provider_order_id) {
        return failure(new ValidationError('Payment initialization failed: no Razorpay order was created'));
      }

      return success({
        order: createdOrder,
        items: preparedOrderItems as any,
        payment: createdPayment,
        razorpayOrderId: createdPayment?.provider_order_id || '',
        shipment: createdShipment,
        pricing: {
          subtotal: orderPricing.subtotal,
          regularSubtotal,
          bundleDiscount,
          bonusPackets,
          totalBundles,
          discount: totalDiscount,
          tax,
          shipping,
          total,
        },
      });
    } catch (err: any) {
      const totalProcessTime = Date.now() - startTime;
      console.error(`\n--- [CHECKOUT_SERVICE: UNHANDLED_EXCEPTION] FAILURE | Time: ${totalProcessTime}ms ---`);
      console.error(`error.name:`, err?.name);
      console.error(`error.message:`, err?.message);
      console.error(`error.stack:`, err?.stack);
      if (err?.code || err?.hint || err?.details) {
        console.error(`PostgREST Error Code:`, err?.code);
        console.error(`SQLSTATE:`, err?.code);
        console.error(`Hint:`, err?.hint);
        console.error(`Details:`, err?.details);
      }
      console.error(`----------------------------------------------------\n`);
      throw err;
    }
  }
}