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
    logger.info(`[CheckoutService.processCheckout] Starting checkout for user ${userId}`);

    // Step 1: Validate Customer Profile
    const userRes = await this.userService.getProfile(userId);
    if (!userRes.success) return failure(userRes.error);

    // Step 2: Validate & Normalize Shipping Address
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
    } else {
      const addrRes = await this.userService.getUserAddresses(userId);
      if (addrRes.success && addrRes.value.length > 0) {
        selectedAddress = addrRes.value.find((a) => a.id === dto.shipping_address_id) || addrRes.value[0];
      }
    }

    if (!selectedAddress || !selectedAddress.address_line1 || !selectedAddress.city) {
      return failure(new ValidationError('Valid shipping address is required for checkout'));
    }

    // Step 3: Load Items (Support both payload items array & database cart)
    let rawItems: any[] = (dto as any).items || [];
    if (!rawItems || rawItems.length === 0) {
      const cartRes = await this.cartService.getCart(userId);
      if (cartRes.success && cartRes.value.items) {
        rawItems = cartRes.value.items;
      }
    }

    if (!rawItems || rawItems.length === 0) {
      return failure(new ValidationError('Cart is empty. Cannot process checkout.'));
    }

    // Step 4: Map Items to Order Snapshots & Calculate Subtotal
    const preparedOrderItems: Record<string, unknown>[] = [];
    let subtotal = 0;

    for (const item of rawItems) {
      const qty = Math.max(1, parseInt(item.qty || item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.price || item.unit_price) || 0);
      const itemTotal = unitPrice * qty;
      subtotal += itemTotal;

      const pId = item.productId || item.product_id || item.id || item._id;
      const vId = item.variant_id || item.variantId || pId;

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

    // Step 5: Coupon Discount
    let discount = 0;
    if (dto.coupon_code) {
      const couponRes = await this.couponService.calculateDiscount({
        code: dto.coupon_code,
        cart_total: subtotal,
      });
      if (couponRes.success) {
        discount = couponRes.value.discountAmount;
      }
    }

    // Step 6: Compute Final Order Pricing
    const shipping = subtotal >= 499 ? 0 : ((dto as any).deliverySpeed === 'express' ? 150 : 50);
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.05 * 100) / 100;
    const total = Math.round((taxableAmount + tax + shipping) * 100) / 100;

    // Step 7: Order & Payment Creation
    const mockRazorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    let createdOrder: Order;
    let createdPayment: Payment;
    let createdShipment: Shipment;

    // Try atomic RPC transaction first
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

    if (txRes.success && txRes.value && txRes.value.order) {
      createdOrder = txRes.value.order as Order;
      createdPayment = txRes.value.payment as Payment;
      createdShipment = txRes.value.shipment as Shipment;
    } else {
      // Robust Fallback: Standard Repository Order Creation
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
      if (!orderRes.success) return failure(orderRes.error);
      createdOrder = orderRes.value;

      const itemsRes = await this.orderService.createOrderItems(createdOrder.id, preparedOrderItems as any);
      if (!itemsRes.success) return failure(itemsRes.error);

      const payRes = await this.paymentService.initiateRazorpayPayment(createdOrder.id, total, createdOrder.order_number);
      if (!payRes.success) return failure(payRes.error);
      createdPayment = payRes.value.payment;

      const shipRes = await this.shipmentService.createShipmentPlaceholder(createdOrder.id);
      if (!shipRes.success) return failure(shipRes.error);
      createdShipment = shipRes.value;
    }

    // Step 8: Clear User Cart
    const cartRes = await this.cartService.getCart(userId);
    if (cartRes.success && cartRes.value.cart) {
      await this.cartService.clearCart(cartRes.value.cart.id);
    }

    logger.info(`[CheckoutService.processCheckout] Checkout complete for order ${createdOrder.order_number}`);

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
  }
}
