import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { ShipmentService } from '@/src/backend/services/shipment.service';
import { handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shipmentService = container.resolve<ShipmentService>(ServiceTokens.ShipmentService);

    // Attempt retrieval by shipmentId first, fallback to orderId
    const timelineRes = await shipmentService.getTrackingTimeline(id);
    if (timelineRes.success) {
      return handleServiceResult(timelineRes);
    }

    const orderShipmentRes = await shipmentService.getShipmentByOrderId(id);
    return handleServiceResult(orderShipmentRes);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
