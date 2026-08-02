import { BaseRepository, IBaseRepository } from './base.repository';
import { Order } from '../models/domain-models.types';
import { CreateOrderDTO } from '../types/dto.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface OrderRepository extends IBaseRepository<Order, string, Partial<Order>, Partial<Order>> {
  findByOrderNumber(orderNumber: string): Promise<Result<Order | null, AppError>>;
  findByUserId(userId: string): Promise<Result<Order[], AppError>>;
  findWithDetails(orderId: string): Promise<Result<Record<string, unknown> | null, AppError>>;
}

export class SupabaseOrderRepository
  extends BaseRepository<Order, string, Partial<Order>, Partial<Order>>
  implements OrderRepository {
  constructor() {
    super('orders');
  }

  public async findByOrderNumber(orderNumber: string): Promise<Result<Order | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findByOrderNumber'));
      }

      return success((data as Order) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findByOrderNumber'));
    }
  }

  public async findByUserId(userId: string): Promise<Result<Order[], AppError>> {
    return this.findAll({ user_id: userId });
  }

  public async findWithDetails(orderId: string): Promise<Result<Record<string, unknown> | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select(`
          *,
          items:order_items(*),
          status_history:order_status_history(*),
          shipment:shipments(*),
          payments:payments(*)
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findWithDetails'));
      }

      return success(data || null);
    } catch (err) {
      return failure(this.handleError(err, 'findWithDetails'));
    }
  }
}
