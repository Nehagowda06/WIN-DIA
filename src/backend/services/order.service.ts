import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError, ValidationError } from '../errors/domain-errors';
import { Order, OrderItem, OrderStatusHistory } from '../models/domain-models.types';
import { CreateOrderDTO, PaginationQueryDTO } from '../types/dto.types';
import { OrderStatus, PaymentStatus, ShippingStatus } from '../enums/entity.enums';
import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/order-item.repository';
import { OrderStatusHistoryRepository } from '../repositories/order-status-history.repository';
import { generateOrderNumber } from '../utils/helpers.util';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface OrderService {
  createOrder(userId: string, orderData: Partial<Order>): Promise<Result<Order, AppError>>;
  createOrderItems(orderId: string, items: Partial<OrderItem>[]): Promise<Result<OrderItem[], AppError>>;
  getOrderById(orderId: string, userId?: string): Promise<Result<Order, AppError>>;
  getOrderByNumber(orderNumber: string, userId?: string): Promise<Result<Order, AppError>>;
  getUserOrders(userId: string, query?: PaginationQueryDTO): Promise<Result<{ items: Order[]; total: number }, AppError>>;
  updateOrderStatus(orderId: string, status: OrderStatus, notes?: string, createdBy?: string): Promise<Result<Order, AppError>>;
  cancelOrder(orderId: string, userId: string, reason?: string): Promise<Result<Order, AppError>>;
  writeStatusHistory(orderId: string, status: OrderStatus, notes?: string, createdBy?: string): Promise<Result<OrderStatusHistory, AppError>>;
}

export class OrderServiceImpl implements OrderService {
  private orderRepo: OrderRepository;
  private orderItemRepo: OrderItemRepository;
  private historyRepo: OrderStatusHistoryRepository;

  constructor(
    orderRepo?: OrderRepository,
    orderItemRepo?: OrderItemRepository,
    historyRepo?: OrderStatusHistoryRepository
  ) {
    this.orderRepo = orderRepo || container.resolve<OrderRepository>(RepositoryTokens.OrderRepository);
    this.orderItemRepo = orderItemRepo || container.resolve<OrderItemRepository>(RepositoryTokens.OrderItemRepository);
    this.historyRepo = historyRepo || container.resolve<OrderStatusHistoryRepository>(RepositoryTokens.OrderStatusHistoryRepository);
  }

  public async createOrder(userId: string, orderData: Partial<Order>): Promise<Result<Order, AppError>> {
    logger.info(`[OrderService.createOrder] Creating order for user ${userId}`);
    const orderNumber = orderData.order_number || generateOrderNumber();

    const newOrderRes = await this.orderRepo.create({
      order_number: orderNumber,
      user_id: userId,
      status: OrderStatus.PENDING,
      payment_status: PaymentStatus.PENDING,
      shipping_status: ShippingStatus.UNFULFILLED,
      currency: orderData.currency || 'INR',
      subtotal_amount: orderData.subtotal_amount || 0,
      discount_amount: orderData.discount_amount || 0,
      tax_amount: orderData.tax_amount || 0,
      shipping_amount: orderData.shipping_amount || 0,
      total_amount: orderData.total_amount || 0,
      coupon_code: orderData.coupon_code || null,
      shipping_address: orderData.shipping_address || {},
      billing_address: orderData.billing_address || orderData.shipping_address || {},
      customer_notes: orderData.customer_notes || null,
      metadata: orderData.metadata || {},
    } as any);

    if (!newOrderRes.success) return newOrderRes;

    await this.writeStatusHistory(newOrderRes.value.id, OrderStatus.PENDING, 'Order created in pending state', userId);
    return success(newOrderRes.value);
  }

  public async createOrderItems(orderId: string, items: Partial<OrderItem>[]): Promise<Result<OrderItem[], AppError>> {
    logger.info(`[OrderService.createOrderItems] Adding ${items.length} items to order ${orderId}`);
    const prepared = items.map((i) => ({ ...i, order_id: orderId }));
    return this.orderItemRepo.createMany(prepared);
  }

  public async getOrderById(orderId: string, userId?: string): Promise<Result<Order, AppError>> {
    const res = await this.orderRepo.findById(orderId);
    if (!res.success) return res;
    if (!res.value) {
      return failure(new NotFoundError(`Order ID ${orderId} not found`));
    }
    if (userId && res.value.user_id !== userId) {
      return failure(new NotFoundError(`Order ID ${orderId} not found for this user`));
    }
    return success(res.value);
  }

  public async getOrderByNumber(orderNumber: string, userId?: string): Promise<Result<Order, AppError>> {
    const res = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!res.success) return res;
    if (!res.value) {
      return failure(new NotFoundError(`Order number ${orderNumber} not found`));
    }
    if (userId && res.value.user_id !== userId) {
      return failure(new NotFoundError(`Order number ${orderNumber} not found for this user`));
    }
    return success(res.value);
  }

  public async getUserOrders(userId: string, query?: PaginationQueryDTO): Promise<Result<{ items: Order[]; total: number }, AppError>> {
    return this.orderRepo.findWithPagination(query?.page, query?.pageSize, { user_id: userId }, query?.sortBy, query?.sortOrder);
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string, createdBy?: string): Promise<Result<Order, AppError>> {
    logger.info(`[OrderService.updateOrderStatus] Order ${orderId} status transitioning to ${status}`);
    const existing = await this.getOrderById(orderId);
    if (!existing.success) return existing;

    const updateRes = await this.orderRepo.update(orderId, { status });
    if (!updateRes.success) return updateRes;

    await this.writeStatusHistory(orderId, status, notes || `Status updated to ${status}`, createdBy);
    return success(updateRes.value);
  }

  public async cancelOrder(orderId: string, userId: string, reason?: string): Promise<Result<Order, AppError>> {
    logger.info(`[OrderService.cancelOrder] Cancelling order ${orderId} for user ${userId}`);
    const existingRes = await this.getOrderById(orderId, userId);
    if (!existingRes.success) return existingRes;

    const order = existingRes.value;
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      return failure(new ValidationError(`Order ${order.order_number} cannot be cancelled in status ${order.status}`));
    }

    const cancelRes = await this.orderRepo.update(orderId, {
      status: OrderStatus.CANCELLED,
    });
    if (!cancelRes.success) return cancelRes;

    await this.writeStatusHistory(orderId, OrderStatus.CANCELLED, reason || 'Order cancelled by customer', userId);
    return success(cancelRes.value);
  }

  public async writeStatusHistory(orderId: string, status: OrderStatus, notes?: string, createdBy?: string): Promise<Result<OrderStatusHistory, AppError>> {
    return this.historyRepo.create({
      order_id: orderId,
      status,
      notes: notes || null,
      created_by: createdBy || null,
    });
  }
}
