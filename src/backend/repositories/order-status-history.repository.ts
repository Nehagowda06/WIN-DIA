import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { OrderStatusHistory } from '../models/domain-models.types';
import { Result } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface OrderStatusHistoryRepository extends IBaseRepository<OrderStatusHistory, string, Partial<OrderStatusHistory>, Partial<OrderStatusHistory>> {
  findByOrderId(orderId: string): Promise<Result<OrderStatusHistory[], AppError>>;
}

export class SupabaseOrderStatusHistoryRepository
  extends BaseRepository<OrderStatusHistory, string, Partial<OrderStatusHistory>, Partial<OrderStatusHistory>>
  implements OrderStatusHistoryRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('order_status_history', clientOrGetter || (() => getServerClient()));
  }

  public async findByOrderId(orderId: string): Promise<Result<OrderStatusHistory[], AppError>> {
    return this.findAll({ order_id: orderId });
  }
}
