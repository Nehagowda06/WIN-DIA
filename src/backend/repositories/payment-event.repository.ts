import { BaseRepository, IBaseRepository } from './base.repository';
import { PaymentEvent } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface PaymentEventRepository extends IBaseRepository<PaymentEvent, string, Partial<PaymentEvent>, Partial<PaymentEvent>> {
  findByPaymentId(paymentId: string): Promise<Result<PaymentEvent[], AppError>>;
}

export class SupabasePaymentEventRepository
  extends BaseRepository<PaymentEvent, string, Partial<PaymentEvent>, Partial<PaymentEvent>>
  implements PaymentEventRepository {
  constructor() {
    super('payment_events');
  }

  public async findByPaymentId(paymentId: string): Promise<Result<PaymentEvent[], AppError>> {
    return this.findAll({ payment_id: paymentId });
  }
}
