import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { PaymentService } from '@/src/backend/services/payment.service';
import { OrderService } from '@/src/backend/services/order.service';
import { InventoryService } from '@/src/backend/services/inventory.service';
import { OrderStatus } from '@/src/backend/enums/entity.enums';
import { getAuthUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function POST(request: Request) {
  try {
    const authRes = await getAuthUserContext(request);
    if (!authRes.success) {
      return handleServiceResult(authRes);
    }

    const body = await request.json().catch(() => ({}));
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Missing payment verification fields'),
        { status: 400 }
      );
    }

    const paymentService = container.resolve<PaymentService>(ServiceTokens.PaymentService);
    const orderService = container.resolve<OrderService>(ServiceTokens.OrderService);
    const inventoryService = container.resolve<InventoryService>(ServiceTokens.InventoryService);

    const verifyRes = await paymentService.verifySignature({
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!verifyRes.success || !verifyRes.value) {
      await paymentService.processFailedPayment(orderId, 'Signature verification failed', body);
      return NextResponse.json(
        createErrorResponse('PAYMENT_ERROR', 'Payment verification failed'),
        { status: 400 }
      );
    }

    // Process payment success & update order status
    await paymentService.processSuccessfulPayment(orderId, razorpay_payment_id, body);
    await orderService.updateOrderStatus(orderId, OrderStatus.PROCESSING, 'Payment verified via Razorpay client SDK', authRes.value.id);

    // Fetch order items and deduct inventory stock cleanly
    const orderRes = await orderService.getOrderById(orderId);
    if (orderRes.success && (orderRes.value as any).order_items) {
      for (const item of (orderRes.value as any).order_items) {
        if (item.variant_id) {
          await inventoryService.deductStockAfterSuccessfulPayment(item.variant_id, item.quantity);
        }
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      orderId,
    });
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
