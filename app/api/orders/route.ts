import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { CheckoutService } from '@/src/backend/services/checkout.service';
import { OrderService } from '@/src/backend/services/order.service';
import { getAuthUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse, createSuccessResponse } from '@/src/backend/types/api-response.types';
import { formatGlobalError } from '@/src/backend/middleware/error-handler.middleware';
import { getEnv } from '@/src/backend/config/env.config';

export async function POST(request: Request) {
  try {
    const authRes = await getAuthUserContext(request);
    if (!authRes.success) {
      return handleServiceResult(authRes);
    }

    const body = await request.json().catch(() => ({}));
    const checkoutService = container.resolve<CheckoutService>(ServiceTokens.CheckoutService);

    const result = await checkoutService.processCheckout(authRes.value.id, body);
    if (!result.success) {
      return handleServiceResult(result);
    }

    const { order, items, payment, razorpayOrderId, pricing } = result.value;
    const isCod = body.paymentMethod === 'cod' || body.payment_method === 'cod';
    const env = getEnv();

    const legacyPayload = {
      success: true,
      order: {
        ...order,
        order_items: items,
      },
      requiresPayment: !isCod,
      razorpay: !isCod
        ? {
            orderId: razorpayOrderId,
            amount: Math.round(pricing.total * 100),
            currency: 'INR',
            keyId: env.RAZORPAY_KEY_ID || '',
          }
        : null,
      data: result.value,
    };

    return NextResponse.json(legacyPayload, { status: 201 });
  } catch (err: any) {
    const formatted = formatGlobalError(err);
    return NextResponse.json(
      createErrorResponse(formatted.errorCode, formatted.message, formatted.details),
      { status: formatted.statusCode }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authRes = await getAuthUserContext(request);
    if (!authRes.success) {
      return handleServiceResult(authRes);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const orderService = container.resolve<OrderService>(ServiceTokens.OrderService);
    const result = await orderService.getUserOrders(authRes.value.id, { page, pageSize });

    if (!result.success) {
      return handleServiceResult(result);
    }

    return NextResponse.json({
      success: true,
      orders: result.value.items,
      total: result.value.total,
      data: result.value,
    });
  } catch (err: any) {
    const formatted = formatGlobalError(err);
    return NextResponse.json(
      createErrorResponse(formatted.errorCode, formatted.message, formatted.details),
      { status: formatted.statusCode }
    );
  }
}
