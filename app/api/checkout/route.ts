import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { CheckoutService } from '@/src/backend/services/checkout.service';
import { getAuthUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function POST(request: Request) {
  try {
    const authRes = await getAuthUserContext(request);
    if (!authRes.success) {
      return handleServiceResult(authRes);
    }

    const body = await request.json().catch(() => ({}));
    const checkoutService = container.resolve<CheckoutService>(ServiceTokens.CheckoutService);
    const result = await checkoutService.processCheckout(authRes.value.id, body);

    return handleServiceResult(result, 201);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
