import { NextResponse } from 'next/server';
import { ServiceTokens } from '@/src/backend/providers/container.provider';
import { OrderService } from '@/src/backend/services/order.service';
import { getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const orderService = adminRes.value.scope.resolve<OrderService>(ServiceTokens.OrderService);
    // Empty userId = list ALL orders (admin view)
    const result = await orderService.getUserOrders('', { page, pageSize });

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const body = await request.json().catch(() => ({}));
    const { orderId, status, notes } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'orderId and status are required'),
        { status: 400 }
      );
    }

    const orderService = adminRes.value.scope.resolve<OrderService>(ServiceTokens.OrderService);
    const result = await orderService.updateOrderStatus(orderId, status, notes, adminRes.value.id);

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
