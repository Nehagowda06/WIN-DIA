import { Shipment, ShipmentTrackingEvent } from '../models/domain-models.types';
import { ShipmentStatus } from '../enums/entity.enums';
import { Result } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface ShipmentService {
  createShipment(orderId: string, courierName?: string): Promise<Result<Shipment, AppError>>;
  getShipmentByOrderId(orderId: string): Promise<Result<Shipment, AppError>>;
  getTrackingInfo(shipmentId: string): Promise<Result<{ shipment: Shipment; events: ShipmentTrackingEvent[] }, AppError>>;
  updateShipmentStatus(shipmentId: string, status: ShipmentStatus, location?: string, description?: string): Promise<Result<Shipment, AppError>>;
}
