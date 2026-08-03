import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError, ValidationError } from '../errors/domain-errors';
import { Order, OrderItem, Payment, Shipment } from '../models/domain-models.types';
import { CreateOrderDTO } from '../types/dto.types';
import { UserService } from './user.service';
import { CartService } from './cart.service';
import { InventoryService } from './inventory.service';
import { CouponService } from './coupon.service';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';
import { ShipmentService } from './shipment.service';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { OrderRepository } from '../repositories/order.repository';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';

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
  private variantRepo: ProductVariantRepository;
  private orderRepo: OrderRepository;
  private inventoryService: InventoryService;
  private couponService: CouponService;
  private orderService: OrderService;
  private paymentService: PaymentService;
  private shipmentService: ShipmentService;

  constructor(
    userService?: UserService,
    cartService?: CartService,
    variantRepo?: ProductVariantRepository,
    orderRepo?: OrderRepository,
    inventoryService?: InventoryService,
    couponService?: CouponService,
    orderService?: OrderService,
    paymentService?: PaymentService,
    shipmentService?: ShipmentService
  ) {
    this.userService = userService || container.resolve<UserService>('UserService');
    this.cartService = cartService || container.resolve<CartService>('CartService');
    this.variantRepo = variantRepo || container.resolve<ProductVariantRepository>(RepositoryTokens.ProductVariantRepository);
    this.orderRepo = orderRepo || container.resolve<OrderRepository>(RepositoryTokens.OrderRepository);
    this.inventoryService = inventoryService || container.resolve<InventoryService>('InventoryService');
    this.couponService = couponService || container.resolve<CouponService>('CouponService');
    this.orderService = orderService || container.resolve<OrderService>('OrderService');
    this.paymentService = paymentService || container.resolve<PaymentService>('PaymentService');
    this.shipmentService = shipmentService || container.resolve<ShipmentService>('ShipmentService');
  }

  public async processCheckout(userId: string, dto: CreateOrderDTO): Promise<Result<CheckoutResult, AppError>> {
    const processStart = Date.now();
    console.log(`\n--- [CHECKOUT_SERVICE: ENTER] processCheckout for userId: ${userId} ---`);

    try {
      // STEP 1: PROFILE_LOOKUP
      const step1Start = Date.now();
      console.log(`[TRACE STEP 1: PROFILE_LOOKUP] Service: UserService | Method: getProfile | Args:`, { userId });
      const userRes = await this.userService.getProfile(userId);
      const step1Time = Date.now() - step1Start;

      if (!userRes.success) {
        console.log(`[TRACE STEP 1: PROFILE_LOOKUP] FAILURE | Time: ${step1Time}ms | Error:`, {
          name: userRes.error.name,
          message: userRes.error.message,
          stack: userRes.error.stack,
          details: userRes.error.details,
        });
        return failure(userRes.error);
      }
      console.log(`[TRACE STEP 1: PROFILE_LOOKUP] SUCCESS | Time: ${step1Time}ms | Profile:`, { id: userRes.value.id, email: userRes.value.email });

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
          selectedAddress = addrRes.value.find((a) => a.id === dto.shipping_address_id) || addrRes.value[0];
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

      // STEP 4: ORDER_PAYLOAD_CREATION & STOCK_VALIDATION
      const step4Start = Date.now();
      console.log(`[TRACE STEP 4: ORDER_PAYLOAD_CREATION & STOCK_VALIDATION] Mapping items to order snapshots`);
      const preparedOrderItems: Record<string, unknown>[] = [];
      let subtotal = 0;

      for (const item of rawItems) {
        const qty = Math.max(1, parseInt(item.qty || item.quantity) || 1);
        const unitPrice = Math.max(0, Number(item.price || item.unit_price) || 0);
        const itemTotal = unitPrice * qty;
        subtotal += itemTotal;

        const pId = item.productId || item.product_id || item.id || item._id;
        const vId = item.variant_id || item.variantId || pId;

        // Wrap stock validation call individually
        console.log(`[TRACE STEP 4: STOCK_VALIDATION] Calling InventoryService.validateStock for variantId: ${vId}, qty: ${qty}`);
        const stockRes = await this.inventoryService.validateStock(String(vId), qty);
        if (!stockRes.success) {
          console.log(`[TRACE STEP 4: STOCK_VALIDATION] FAILURE | Error:`, stockRes.error);
        }

        preparedOrderItems.push({
          product_id: pId,
          variant_id: vId,
          product_name: item.name || item.product_name || 'WIN-DIA Product',
          variant_name: item.flavor || item.variant_name || item.name || 'Standard',
          sku: item.sku || `SKU-${String(pId).slice(0, 8)}`,
          unit_price: unitPrice,
          quantity: qty,
          total_price: itemTotal,
          price_snapshot: { price: unitPrice, sku: item.sku || null },
        });
      }
      const step4Time = Date.now() - step4Start;
      console.log(`[TRACE STEP 4: ORDER_PAYLOAD_CREATION] SUCCESS | Time: ${step4Time}ms | Subtotal: ${subtotal}`, preparedOrderItems);

      // STEP 5: COUPON_VALIDATION
      const step5Start = Date.now();
      let discount = 0;
      if (dto.coupon_code) {
        console.log(`[TRACE STEP 5: COUPON_VALIDATION] Calling CouponService.calculateDiscount for code: ${dto.coupon_code}`);
        const couponRes = await this.couponService.calculateDiscount({
          code: dto.coupon_code,
          cart_total: subtotal,
        });
        if (couponRes.success) {
          discount = couponRes.value.discountAmount;
          console.log(`[TRACE STEP 5: COUPON_VALIDATION] SUCCESS | Discount: ${discount}`);
        } else {
          console.log(`[TRACE STEP 5: COUPON_VALIDATION] FAILURE | Error:`, couponRes.error);
        }
      }
      const step5Time = Date.now() - step5Start;
      console.log(`[TRACE STEP 5: COUPON_VALIDATION] Finished | Time: ${step5Time}ms`);

      // STEP 6: PRICING_CALCULATION
      const shipping = subtotal >= 499 ? 0 : ((dto as any).deliverySpeed === 'express' ? 150 : 50);
      const taxableAmount = Math.max(0, subtotal - discount);
      const tax = Math.round(taxableAmount * 0.05 * 100) / 100;
      const total = Math.round((taxableAmount + tax + shipping) * 100) / 100;
      console.log(`[TRACE STEP 6: PRICING_CALCULATION] Pricing:`, { subtotal, discount, tax, shipping, total });

      // STEP 7: RPC_INVOCATION & ORDER_CREATION
      const step7Start = Date.now();
      const mockRazorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      let createdOrder: Order;
      let createdPayment: Payment;
      let createdShipment: Shipment;

      console.log(`[TRACE STEP 7: RPC_INVOCATION] Calling OrderRepository.createCheckoutTransaction RPC`);
      console.log(`RPC Params:`, {
        userId,
        orderData: { subtotal, discount, tax, shipping, total, coupon_code: dto.coupon_code || null },
        itemsCount: preparedOrderItems.length,
        paymentData: { mockRazorpayOrderId, total },
      });

      const txRes = await this.orderRepo.createCheckoutTransaction(
        userId,
        {
          subtotal_amount: subtotal,
          discount_amount: discount,
          tax_amount: tax,
          shipping_amount: shipping,
          total_amount: total,
          coupon_code: dto.coupon_code || null,
          shipping_address: selectedAddress,
          customer_notes: dto.customer_notes || (dto as any).orderNotes || null,
        },
        preparedOrderItems,
        {
          payment_provider: 'razorpay',
          provider_order_id: mockRazorpayOrderId,
          amount: total,
          currency: 'INR',
          status: 'pending',
          payment_method: (dto as any).paymentMethod || 'razorpay',
        },
        {
          courier_name: 'NimbusPost',
          status: 'pending',
        }
      );
      const step7Time = Date.now() - step7Start;

      if (txRes.success && txRes.value && txRes.value.order) {
        console.log(`[TRACE STEP 7: RPC_INVOCATION] RPC SUCCESS | Time: ${step7Time}ms | Returned JSON:`, txRes.value);
        createdOrder = txRes.value.order as Order;
        createdPayment = txRes.value.payment as Payment;
        createdShipment = txRes.value.shipment as Shipment;
      } else {
        console.log(`[TRACE STEP 7: RPC_INVOCATION] RPC FAILED | Time: ${step7Time}ms | Database Error:`, txRes.error);
        console.log(`[TRACE STEP 7: FALLBACK] Initiating standard repository order creation fallback`);

        const orderRes = await this.orderService.createOrder(userId, {
          subtotal_amount: subtotal,
          discount_amount: discount,
          tax_amount: tax,
          shipping_amount: shipping,
          total_amount: total,
          coupon_code: dto.coupon_code || null,
          shipping_address: selectedAddress as any,
          customer_notes: dto.customer_notes || (dto as any).orderNotes || null,
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

      // STEP 9: CLEAR_CART
      const cartRes = await this.cartService.getCart(userId);
      if (cartRes.success && cartRes.value.cart) {
        await this.cartService.clearCart(cartRes.value.cart.id);
      }

      const totalProcessTime = Date.now() - processStart;
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
      const totalProcessTime = Date.now() - processStart;
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
