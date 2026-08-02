import { BaseRepository, IBaseRepository } from './base.repository';
import { ShipmentTrackingEvent } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface ShipmentTrackingEventRepository extends IBaseRepository<ShipmentTrackingEvent, string, Partial<ShipmentTrackingEvent>, Partial<ShipmentTrackingEvent>> {
  findByShipmentId(shipmentId: string): Promise<Result<ShipmentTrackingEvent[], AppError>>;
}

export class SupabaseShipmentTrackingEventRepository
  extends BaseRepository<ShipmentTrackingEvent, string, Partial<ShipmentTrackingEvent>, Partial<ShipmentTrackingEvent>>
  implements ShipmentTrackingEventRepository {
  constructor() {
    super('shipment_tracking_events');
  }

  public async findByShipmentId(shipmentId: string): Promise<Result<ShipmentTrackingEvent[], AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('event_timestamp', { ascending: true });

      if (error) {
        return failure(this.handleError(error, 'findByShipmentId'));
      }

      return success((data as ShipmentTrackingEvent[]) || []);
    } catch (err) {
      return failure(this.handleError(err, 'findByShipmentId'));
    }
  }
}
