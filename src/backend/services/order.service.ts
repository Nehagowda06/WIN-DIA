import { Order, OrderItem } from '../models/domain-models.types';
import { CreateOrderDTO, PaginationQueryDTO } from '../types/dto.types';
import { OrderStatus } from '../enums/entity.enums';
import { Result } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface OrderService {
  createOrder(userId: string, dto: CreateOrderDTO): Promise<Result<{ order: Order; items: OrderItem[] }, AppError>>;
  getOrderById(orderId: string, userId?: string): Promise<Result<{ order: Order; items: OrderItem[] }, AppError>>;
  getOrderByNumber(orderNumber: string, userId?: string): Promise<Result<{ order: Order; items: OrderItem[] }, AppError>>;
  getUserOrders(userId: string, query?: PaginationQueryDTO): Promise<Result<{ items: Order[]; total: number }, AppError>>;
  updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Result<Order, AppError>>;
  cancelOrder(orderId: string, userId: string, reason?: string): Promise<Result<Order, AppError>>;
}
