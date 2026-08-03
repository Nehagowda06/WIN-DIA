import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { PaymentEvent } from '../models/domain-models.types';
import { getServerClient } from '../config/supabase.config';

export interface PaymentEventRepository extends IBaseRepository<PaymentEvent, string, Partial<PaymentEvent>, Partial<PaymentEvent>> {}

export class SupabasePaymentEventRepository
  extends BaseRepository<PaymentEvent, string, Partial<PaymentEvent>, Partial<PaymentEvent>>
  implements PaymentEventRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('payment_events', clientOrGetter || (() => getServerClient()));
  }
}
