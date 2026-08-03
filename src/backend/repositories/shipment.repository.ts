import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { Shipment } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface ShipmentRepository extends IBaseRepository<Shipment, string, Partial<Shipment>, Partial<Shipment>> {
  findByOrderId(orderId: string): Promise<Result<Shipment | null, AppError>>;
  findByWaybill(waybill: string): Promise<Result<Shipment | null, AppError>>;
}

export class SupabaseShipmentRepository
  extends BaseRepository<Shipment, string, Partial<Shipment>, Partial<Shipment>>
  implements ShipmentRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('shipments', clientOrGetter || (() => getServerClient()));
  }

  public async findByOrderId(orderId: string): Promise<Result<Shipment | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findByOrderId'));
      }

      return success((data as Shipment) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findByOrderId'));
    }
  }

  public async findByWaybill(waybill: string): Promise<Result<Shipment | null, AppError>> {
    const res = await this.findAll({ waybill });
    if (!res.success) return failure(res.error);
    return success(res.value[0] || null);
  }
}
