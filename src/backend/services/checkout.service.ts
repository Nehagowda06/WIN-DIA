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
  private inventoryService: InventoryService;
  private couponService: CouponService;
  private orderService: OrderService;
  private paymentService: PaymentService;
  private shipmentService: ShipmentService;

  constructor(
    userService?: UserService,
    cartService?: CartService,
    variantRepo?: ProductVariantRepository,
    inventoryService?: InventoryService,
    couponService?: CouponService,
    orderService?: OrderService,
    paymentService?: PaymentService,
    shipmentService?: ShipmentService
  ) {
    this.userService = userService || container.resolve<UserService>('UserService');
    this.cartService = cartService || container.resolve<CartService>('CartService');
    this.variantRepo = variantRepo || container.resolve<ProductVariantRepository>(RepositoryTokens.ProductVariantRepository);
    this.inventoryService = inventoryService || container.resolve<InventoryService>('InventoryService');
    this.couponService = couponService || container.resolve<CouponService>('CouponService');
    this.orderService = orderService || container.resolve<OrderService>('OrderService');
    this.paymentService = paymentService || container.resolve<PaymentService>('PaymentService');
    this.shipmentService = shipmentService || container.resolve<ShipmentService>('ShipmentService');
  }

  public async processCheckout(userId: string, dto: CreateOrderDTO): Promise<Result<CheckoutResult, AppError>> {
    logger.info(`[CheckoutService.processCheckout] Starting checkout orchestration for user ${userId}`);

    // Step 1: Validate Customer
    const userRes = await this.userService.getProfile(userId);
    if (!userRes.success) return failure(userRes.error);

    // Step 2: Validate Address
    const addrRes = await this.userService.getUserAddresses(userId);
    if (!addrRes.success) return failure(addrRes.error);
    const selectedAddress = addrRes.value.find((a) => a.id === dto.shipping_address_id) || addrRes.value[0];
    if (!selectedAddress) {
      return failure(new ValidationError('Valid shipping address is required for checkout'));
    }

    // Step 3: Load Cart
    const cartRes = await this.cartService.getCart(userId);
    if (!cartRes.success) return failure(cartRes.error);
    const cartItems = cartRes.value.items;

    // Step 4: Validate Cart Items
    if (!cartItems || cartItems.length === 0) {
      return failure(new ValidationError('Cart is empty. Cannot process checkout.'));
    }

    // Step 5 & 6: Validate Product Variants & Inventory Stock
    const preparedOrderItems: Partial<OrderItem>[] = [];
    let subtotal = 0;

    for (const item of cartItems) {
      const variantRes = await this.variantRepo.findById(item.variant_id);
      if (!variantRes.success) return failure(variantRes.error);
      if (!variantRes.value || !variantRes.value.is_active) {
        return failure(new NotFoundError(`Variant ID ${item.variant_id} is no longer available`));
      }

      const variant = variantRes.value;

      // Validate stock via InventoryService
      const stockRes = await this.inventoryService.validateStock(variant.id, item.quantity);
      if (!stockRes.success) return failure(stockRes.error);

      const itemTotal = Number(variant.price) * item.quantity;
      subtotal += itemTotal;

      preparedOrderItems.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        product_name: variant.name,
        variant_name: variant.name,
        sku: variant.sku,
        unit_price: Number(variant.price),
        quantity: item.quantity,
        total_price: itemTotal,
        price_snapshot: { price: variant.price, sku: variant.sku },
      });
    }

    // Step 7: Coupon Validation & Discount
    let discount = 0;
    if (dto.coupon_code) {
      const couponRes = await this.couponService.calculateDiscount({
        code: dto.coupon_code,
        cart_total: subtotal,
      });
      if (!couponRes.success) return failure(couponRes.error);
      discount = couponRes.value.discountAmount;
    }

    // Step 8: Calculate Pricing
    const shipping = subtotal >= 499 ? 0 : 50;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.05 * 100) / 100;
    const total = Math.round((taxableAmount + tax + shipping) * 100) / 100;

    // Step 9: OrderService.createOrder()
    const orderRes = await this.orderService.createOrder(userId, {
      subtotal_amount: subtotal,
      discount_amount: discount,
      tax_amount: tax,
      shipping_amount: shipping,
      total_amount: total,
      coupon_code: dto.coupon_code || null,
      shipping_address: selectedAddress as any,
      customer_notes: dto.customer_notes || null,
    });
    if (!orderRes.success) return failure(orderRes.error);
    const order = orderRes.value;

    // Step 10: OrderService.createOrderItems()
    const itemsRes = await this.orderService.createOrderItems(order.id, preparedOrderItems);
    if (!itemsRes.success) return failure(itemsRes.error);

    // Step 11: PaymentService.initiateRazorpayPayment()
    const paymentRes = await this.paymentService.initiateRazorpayPayment(order.id, total, order.order_number);
    if (!paymentRes.success) return failure(paymentRes.error);

    // Step 12: ShipmentService.createShipmentPlaceholder()
    const shipmentRes = await this.shipmentService.createShipmentPlaceholder(order.id);
    if (!shipmentRes.success) return failure(shipmentRes.error);

    // Step 13: Clear user cart
    await this.cartService.clearCart(cartRes.value.cart.id);

    logger.info(`[CheckoutService.processCheckout] Checkout orchestration complete for order ${order.order_number}`);

    return success({
      order,
      items: itemsRes.value,
      payment: paymentRes.value.payment,
      razorpayOrderId: paymentRes.value.razorpayOrderId,
      shipment: shipmentRes.value,
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
