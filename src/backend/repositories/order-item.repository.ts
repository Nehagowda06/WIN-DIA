import { BaseRepository, IBaseRepository } from './base.repository';
import { OrderItem } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface OrderItemRepository extends IBaseRepository<OrderItem, string, Partial<OrderItem>, Partial<OrderItem>> {
  findByOrderId(orderId: string): Promise<Result<OrderItem[], AppError>>;
  createMany(items: Partial<OrderItem>[]): Promise<Result<OrderItem[], AppError>>;
}

export class SupabaseOrderItemRepository
  extends BaseRepository<OrderItem, string, Partial<OrderItem>, Partial<OrderItem>>
  implements OrderItemRepository {
  constructor() {
    super('order_items');
  }

  public async findByOrderId(orderId: string): Promise<Result<OrderItem[], AppError>> {
    return this.findAll({ order_id: orderId });
  }

  public async createMany(items: Partial<OrderItem>[]): Promise<Result<OrderItem[], AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .insert(items as any)
        .select('*');

      if (error) {
        return failure(this.handleError(error, 'createMany'));
      }

      return success((data as OrderItem[]) || []);
    } catch (err) {
      return failure(this.handleError(err, 'createMany'));
    }
  }
}
