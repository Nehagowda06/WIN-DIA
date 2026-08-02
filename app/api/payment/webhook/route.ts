import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { PaymentService } from '@/src/backend/services/payment.service';
import { handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-razorpay-signature') || '';
    const payload = await request.json().catch(() => ({}));

    const paymentService = container.resolve<PaymentService>(ServiceTokens.PaymentService);
    const result = await paymentService.handleWebhook(payload, signature);

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
