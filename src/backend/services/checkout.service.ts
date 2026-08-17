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
import { stableProductUuid } from '../utils/helpers.util';
import { getAdminClient } from '../config/supabase.config';
import { BundlePricing, calculateBundlePricing, calculateOrderTotal } from '../constants/bundle-pricing.constants';

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
  };
}

export interface CheckoutService {
  processCheckout(userId: string, dto: CreateOrderDTO): Promise<Result<CheckoutResult, AppError>>;
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

  public async processCheckout(userId: string, dto: CreateOrderDTO): Promise<Result<CheckoutResult, AppError>> {
    console.log(`\n--- [CHECKOUT_SERVICE: ENTER] processCheckout for userId: ${userId} ---`);
    const startTime = Date.now();

    try {
      // STEP 1: VALIDATION
      const step1Start = Date.now();
      console.log(`[TRACE STEP 1: VALIDATION] Validating DTO payload:`, dto);
      if (!userId) {
        console.log(`[TRACE STEP 1: VALIDATION] FAILURE | Error: User ID is required`);
        return failure(new ValidationError('User ID is required for checkout'));
      }
      const step1Time = Date.now() - step1Start;
      console.log(`[TRACE STEP 1: VALIDATION] SUCCESS | Time: ${step1Time}ms`);

      // STEP 2: ADDRESS_LOOKUP
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
        };
        console.log(`[TRACE STEP 2: ADDRESS_LOOKUP] Used inline address payload:`, selectedAddress);
      } else {
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

      // STEP 3: CART_LOOKUP
      const step3Start = Date.now();
      console.log(`[TRACE STEP 3: CART_LOOKUP] Resolving items from request dto or CartService`);
      let rawItems: any[] = (dto as any).items || [];
      if (!rawItems || rawItems.length === 0) {
        console.log(`[TRACE STEP 3: CART_LOOKUP] Calling CartService.getCart for userId: ${userId}`);
        const cartRes = await this.cartService.getCart(userId);
        if (cartRes.success && cartRes.value.items) {
          rawItems = cartRes.value.items;
        }
      }
      const step3Time = Date.now() - step3Start;

      if (!rawItems || rawItems.length === 0) {
        console.log(`[TRACE STEP 3: CART_LOOKUP] FAILURE | Time: ${step3Time}ms | Error: Cart is empty`);
        return failure(new ValidationError('Cart is empty. Cannot process checkout.'));
      }
      console.log(`[TRACE STEP 3: CART_LOOKUP] SUCCESS | Time: ${step3Time}ms | Items Count: ${rawItems.length}`, rawItems);

      // STEP 4: ORDER_PAYLOAD_CREATION & STOCK_VALIDATION (BUNDLE PRICING ENFORCED)
      const step4Start = Date.now();
      console.log(`[TRACE STEP 4: ORDER_PAYLOAD_CREATION & STOCK_VALIDATION] Mapping items to order snapshots with BUNDLE PRICING`);
      const preparedOrderItems: Record<string, unknown>[] = [];
      let subtotal = 0;

      for (const item of rawItems) {
        // qty from frontend represents number of BUNDLES (enforced by frontend selector)
        const bundles = Math.max(BundlePricing.MIN_BUNDLES, Math.min(BundlePricing.MAX_BUNDLES_PER_ITEM, Math.floor(parseInt(item.qty || item.quantity) || 1)));
        const bundlePricing = calculateBundlePricing(bundles);

        // SERVER-SIDE PRICE ENFORCEMENT: Never trust frontend-sent price.
        // Price is ALWAYS BundlePricing.BUNDLE_PRICE per bundle, regardless of what frontend sends.
        const itemTotal = bundlePricing.lineTotal;
        subtotal += itemTotal;

        const rawId = item.productId || item.product_id || item.id || item._id;
        let validProductId: string;

        // PRODUCT RESOLUTION: Try to find the real product in the database.
        // Priority: 1) Direct UUID lookup, 2) Slug lookup, 3) Flavor/name lookup
        // This prevents ghost product creation when frontend sends slug-based IDs.
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (uuidPattern.test(rawId)) {
          // Frontend sent a real UUID — use it directly
          const prodCheck = await this.productRepo.findById(rawId);
          if (prodCheck.success && prodCheck.value) {
            validProductId = rawId;
          } else {
            // UUID doesn't match any product — try slug/name fallback
            validProductId = rawId;
          }
        } else {
          // Frontend sent a slug-based ID (e.g., "gluten-free-jeera" or "jeera-thins")
          // Try to resolve it to a real product
          let resolvedProduct = null;

          // Strategy 1: Try finding by slug directly
          const slugVariants = [
            rawId,                              // e.g., "gluten-free-jeera"
            rawId.replace(/^(gluten-free|everyday)-/, ''), // strip prefix → "jeera"
            `${rawId}-thins`,                   // e.g., "jeera-thins"
            rawId.replace(/^(gluten-free|everyday)-/, '') + '-thins', // "jeera-thins"
          ];

          for (const slug of slugVariants) {
            const slugRes = await this.productRepo.findBySlug(slug);
            if (slugRes.success && slugRes.value) {
              resolvedProduct = slugRes.value;
              break;
            }
          }

          // Strategy 2: Search by flavor (extracted from item name or slug)
          if (!resolvedProduct) {
            const flavor = item.flavor || item.flavour ||
              rawId.replace(/^(gluten-free|everyday)-/, '').replace(/-thins$/, '');
            if (flavor) {
              const allProducts = await this.productRepo.findAll({ is_active: true });
              if (allProducts.success) {
                resolvedProduct = allProducts.value.find(
                  (p) => p.flavor?.toLowerCase() === flavor.toLowerCase() ||
                         p.name?.toLowerCase().includes(flavor.toLowerCase()) ||
                         p.slug?.toLowerCase().includes(flavor.toLowerCase())
                ) || null;
              }
            }
          }

          if (resolvedProduct) {
            validProductId = resolvedProduct.id;
          } else {
            // Last resort: use stableProductUuid to maintain backward compatibility
            // This ensures FK constraint is satisfied, but logs a warning
            validProductId = stableProductUuid(rawId);
            console.warn(
              `[CheckoutService] Could not resolve product for ID "${rawId}". ` +
              `Using generated UUID ${validProductId}. Product may need to be seeded in the database.`
            );
          }
        }

        // Only create a placeholder product if the resolved ID doesn't exist in DB.
        // This is a safety net — in production all products should be pre-seeded.
        try {
          const prodCheck = await this.productRepo.findById(validProductId);
          if (!prodCheck.success || !prodCheck.value) {
            console.warn(
              `[CheckoutService] Product ${validProductId} not found in DB for item "${item.name}". ` +
              `Creating placeholder. Ensure products are properly seeded.`
            );
            const adminClient = getAdminClient();
            await adminClient.from('products').upsert({
              id: validProductId,
              name: item.name || item.product_name || 'WIN-DIA Product',
              slug: rawId.replace(/^(gluten-free|everyday)-/, ''),
              price: BundlePricing.BUNDLE_PRICE,
              count_in_stock: 100,
              is_active: true,
            });
          }
        } catch (_) {}

        // Stock validation: check against packets to be SHIPPED (12 per bundle)
        // This is the real quantity that leaves the warehouse
        console.log(`[TRACE STEP 4: STOCK_VALIDATION] Calling InventoryService.validateStock for productId: ${validProductId}, packetsShipped: ${bundlePricing.packetsShipped}`);
        const stockRes = await this.inventoryService.validateStock(validProductId, bundlePricing.packetsShipped);
        if (!stockRes.success) {
          console.log(`[TRACE STEP 4: STOCK_VALIDATION] Insufficient stock:`, stockRes.error);
          return failure(new ValidationError(
            `Insufficient stock for "${item.name || 'product'}". Requested ${bundles} bundle(s) (${bundlePricing.packetsShipped} packets) but not enough inventory available.`
          ));
        }

        preparedOrderItems.push({
          product_id: validProductId,
          name: item.name || item.product_name || 'WIN-DIA Product',
          // Store bundle price as the unit price (price per bundle)
          price: BundlePricing.BUNDLE_PRICE,
          // qty = number of bundles ordered
          qty: bundles,
          flavor: item.flavor || null,
          net_weight_grams: Number(item.net_weight_grams || item.net_weight || item.netWeight || 200) * bundlePricing.packetsShipped,
          image: item.image || item.image_url || null,
        });
      }
      const step4Time = Date.now() - step4Start;
      console.log(`[TRACE STEP 4: ORDER_PAYLOAD_CREATION] SUCCESS | Time: ${step4Time}ms | Subtotal: ${subtotal}`, preparedOrderItems);

      // STEP 5: COUPON_VALIDATION
      const step5Start = Date.now();
      let discount = 0;
      let validatedCouponId: string | null = null;
      if (dto.coupon_code) {
        console.log(`[TRACE STEP 5: COUPON_VALIDATION] Calling CouponService.calculateDiscount for code: ${dto.coupon_code}`);
        const couponRes = await this.couponService.calculateDiscount({
          code: dto.coupon_code,
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

      // STEP 6: PRICING_CALCULATION (SERVER-SIDE ONLY — FREE DELIVERY ENFORCED)
      // Shipping is ALWAYS ₹0. This is hardcoded and cannot be overridden by frontend.
      const orderPricing = calculateOrderTotal(subtotal, discount);
      const { shipping, tax, total } = orderPricing;
      console.log(`[TRACE STEP 6: PRICING_CALCULATION] Pricing (FREE DELIVERY enforced):`, orderPricing);

      // STEP 7: RPC_INVOCATION & ORDER_CREATION
      const step7Start = Date.now();
      const mockRazorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      let createdOrder: Order;
      let createdPayment: Payment;
      let createdShipment: Shipment;

      console.log(`[TRACE STEP 7: RPC_INVOCATION] Calling OrderRepository.createCheckoutTransaction RPC`);
      console.log(`RPC Params:`, {
        userId,
        orderData: { subtotal, discount, tax, shipping, total },
        itemsCount: preparedOrderItems.length,
        paymentData: { mockRazorpayOrderId, total },
      });

      const selectedPaymentMethod = (dto as any).paymentMethod || (dto as any).payment_method || 'razorpay';

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
        },
        preparedOrderItems,
        {
          payment_provider: 'razorpay',
          provider_order_id: mockRazorpayOrderId,
          amount: total,
          currency: 'INR',
          status: 'pending',
          payment_method: selectedPaymentMethod,
        },
        {
          courier_name: 'Shiprocket',
          status: 'pending',
        }
      );
      const step7Time = Date.now() - step7Start;

      if (txRes.success && txRes.value && txRes.value.order) {
        console.log(`[TRACE STEP 7: RPC_INVOCATION] RPC SUCCESS | Time: ${step7Time}ms | Returned JSON:`, txRes.value);
        createdOrder = txRes.value.order as Order;
        createdPayment = txRes.value.payment as Payment;
        createdShipment = txRes.value.shipment as Shipment;

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
      } else {
        console.log(`[TRACE STEP 7: RPC_INVOCATION] RPC FAILED | Time: ${step7Time}ms | Database Error:`, txRes.error);
        console.log(`[TRACE STEP 7: FALLBACK] Initiating standard repository order creation fallback`);

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
        createdOrder = orderRes.value;
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
        createdPayment = payRes.value.payment;
        console.log(`[TRACE STEP 8: RAZORPAY_ORDER_CREATION] SUCCESS | Time: ${step8Time}ms | RazorpayOrderId: ${payRes.value.razorpayOrderId}`);

        const shipRes = await this.shipmentService.createShipmentPlaceholder(createdOrder.id);
        if (!shipRes.success) {
          console.error(`[TRACE STEP 7: FALLBACK_SHIPMENT_CREATE] FAILURE | Error:`, shipRes.error);
          return failure(shipRes.error);
        }
        createdShipment = shipRes.value;
      }

      // STEP 9: CLEAR_CART & INCREMENT COUPON USAGE
      const cartRes = await this.cartService.getCart(userId);
      if (cartRes.success && cartRes.value.cart) {
        await this.cartService.clearCart(cartRes.value.cart.id);
      }

      // Increment coupon usage count to prevent double-use
      if (validatedCouponId) {
        await this.couponService.incrementUsage(validatedCouponId);
      }

      const totalProcessTime = Date.now() - startTime;
      console.log(`--- [CHECKOUT_SERVICE: EXIT_SUCCESS] Total Time: ${totalProcessTime}ms | OrderNumber: ${createdOrder.order_number} ---\n`);

      return success({
        order: createdOrder,
        items: preparedOrderItems as any,
        payment: createdPayment,
        razorpayOrderId: createdPayment?.provider_order_id || mockRazorpayOrderId,
        shipment: createdShipment,
        pricing: {
          subtotal,
          discount,
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
