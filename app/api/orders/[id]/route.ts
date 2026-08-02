import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { OrderService } from '@/src/backend/services/order.service';
import { getAuthUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authRes = await getAuthUserContext(request);
    if (!authRes.success) {
      return handleServiceResult(authRes);
    }

    const orderService = container.resolve<OrderService>(ServiceTokens.OrderService);
    const result = await orderService.getOrderById(id, authRes.value.id);

    if (!result.success) {
      return handleServiceResult(result);
    }

    return NextResponse.json({
      success: true,
      order: result.value,
      data: result.value,
    });
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
