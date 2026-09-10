import { NextResponse } from 'next/server';
import { container, ServiceTokens, RepositoryTokens } from '@/src/backend/providers/container.provider';
import { OrderService } from '@/src/backend/services/order.service';
import { OrderItemRepository } from '@/src/backend/repositories/order-item.repository';
import { getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Order ID is required'),
        { status: 400 }
      );
    }

    const orderService = adminRes.value.scope.resolve<OrderService>(ServiceTokens.OrderService);
    // Get order details without userId restriction (admin can see all)
    const result = await orderService.getOrderById(orderId);

    if (!result.success) {
      return handleServiceResult(result);
    }

    // Fetch order items separately since getOrderById doesn't include them
    const orderItemRepo = container.resolve<OrderItemRepository>(RepositoryTokens.OrderItemRepository);
    const itemsRes = await orderItemRepo.findAll({ order_id: orderId });
    const order_items = itemsRes.success ? itemsRes.value : [];

    return NextResponse.json({
      success: true,
      data: {
        ...result.value,
        order_items,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
