import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { Payment } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface PaymentRepository extends IBaseRepository<Payment, string, Partial<Payment>, Partial<Payment>> {
  findByOrderId(orderId: string): Promise<Result<Payment[], AppError>>;
  findByProviderOrderId(providerOrderId: string): Promise<Result<Payment | null, AppError>>;
}

export class SupabasePaymentRepository
  extends BaseRepository<Payment, string, Partial<Payment>, Partial<Payment>>
  implements PaymentRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('payments', clientOrGetter || (() => getServerClient()));
  }

  public async findByOrderId(orderId: string): Promise<Result<Payment[], AppError>> {
    return this.findAll({ order_id: orderId });
  }

  public async findByProviderOrderId(providerOrderId: string): Promise<Result<Payment | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('provider_order_id', providerOrderId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findByProviderOrderId'));
      }

      return success((data as Payment) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findByProviderOrderId'));
    }
  }
}
