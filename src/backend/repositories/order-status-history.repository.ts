import { BaseRepository, IBaseRepository } from './base.repository';
import { OrderStatusHistory } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface OrderStatusHistoryRepository extends IBaseRepository<OrderStatusHistory, string, Partial<OrderStatusHistory>, Partial<OrderStatusHistory>> {
  findByOrderId(orderId: string): Promise<Result<OrderStatusHistory[], AppError>>;
}

export class SupabaseOrderStatusHistoryRepository
  extends BaseRepository<OrderStatusHistory, string, Partial<OrderStatusHistory>, Partial<OrderStatusHistory>>
  implements OrderStatusHistoryRepository {
  constructor() {
    super('order_status_history');
  }

  public async findByOrderId(orderId: string): Promise<Result<OrderStatusHistory[], AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        return failure(this.handleError(error, 'findByOrderId'));
      }

      return success((data as OrderStatusHistory[]) || []);
    } catch (err) {
      return failure(this.handleError(err, 'findByOrderId'));
    }
  }
}
