import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { ShipmentTrackingEvent } from '../models/domain-models.types';
import { Result } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface ShipmentTrackingEventRepository extends IBaseRepository<ShipmentTrackingEvent, string, Partial<ShipmentTrackingEvent>, Partial<ShipmentTrackingEvent>> {
  findByShipmentId(shipmentId: string): Promise<Result<ShipmentTrackingEvent[], AppError>>;
}

export class SupabaseShipmentTrackingEventRepository
  extends BaseRepository<ShipmentTrackingEvent, string, Partial<ShipmentTrackingEvent>, Partial<ShipmentTrackingEvent>>
  implements ShipmentTrackingEventRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('shipment_tracking_events', clientOrGetter || (() => getServerClient()));
  }

  public async findByShipmentId(shipmentId: string): Promise<Result<ShipmentTrackingEvent[], AppError>> {
    return this.findAll({ order_id: shipmentId });
  }
}
