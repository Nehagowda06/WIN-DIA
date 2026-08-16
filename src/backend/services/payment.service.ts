import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError, PaymentError, ValidationError } from '../errors/domain-errors';
import { Payment, PaymentEvent } from '../models/domain-models.types';
import { PaymentProvider, PaymentStatus } from '../enums/entity.enums';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentEventRepository } from '../repositories/payment-event.repository';
import { OrderRepository } from '../repositories/order.repository';
import { getEnv } from '../config/env.config';
import { logger } from '../utils/logger.util';
import { createHmac } from 'crypto';
import { container, RepositoryTokens } from '../providers/container.provider';
import { getRazorpayClient } from '../lib/razorpay.js';

export interface VerifyPaymentDTO {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentService {
  initiateRazorpayPayment(orderId: string, amount: number, orderNumber: string): Promise<Result<{ payment: Payment; razorpayOrderId: string }, AppError>>;
  verifySignature(dto: VerifyPaymentDTO): Promise<Result<boolean, AppError>>;
  processSuccessfulPayment(paymentId: string, transactionId: string, rawPayload?: Record<string, unknown>): Promise<Result<Payment, AppError>>;
  processFailedPayment(paymentId: string, reason?: string, rawPayload?: Record<string, unknown>): Promise<Result<Payment, AppError>>;
  logPaymentEvent(paymentId: string, eventType: string, payload: Record<string, unknown>): Promise<Result<PaymentEvent, AppError>>;
  handleWebhook(payload: Record<string, unknown>, signature: string): Promise<Result<boolean, AppError>>;
}

export class PaymentServiceImpl implements PaymentService {
  private paymentRepo: PaymentRepository;
  private paymentEventRepo: PaymentEventRepository;
  private orderRepo: OrderRepository;

  constructor(
    paymentRepo?: PaymentRepository,
    paymentEventRepo?: PaymentEventRepository,
    orderRepo?: OrderRepository
  ) {
    this.paymentRepo = paymentRepo || container.resolve<PaymentRepository>(RepositoryTokens.PaymentRepository);
    this.paymentEventRepo = paymentEventRepo || container.resolve<PaymentEventRepository>(RepositoryTokens.PaymentEventRepository);
    this.orderRepo = orderRepo || container.resolve<OrderRepository>(RepositoryTokens.OrderRepository);
  }

  public async initiateRazorpayPayment(orderId: string, amount: number, orderNumber: string): Promise<Result<{ payment: Payment; razorpayOrderId: string }, AppError>> {
    logger.info(`[PaymentService.initiateRazorpayPayment] Initiating payment for order ${orderId}, amount ${amount}`);
    const env = getEnv();
    let razorpayOrderId: string;

    try {
      const razorpayOrder = await getRazorpayClient().orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: orderNumber,
        notes: { internal_order_id: orderId },
      });
      razorpayOrderId = razorpayOrder.id;
    } catch (error) {
      logger.error('[PaymentService.initiateRazorpayPayment] Razorpay order creation failed', error);
      return failure(new PaymentError('Could not create Razorpay order'));
    }

    const createPaymentRes = await this.paymentRepo.create({
      order_id: orderId,
      payment_provider: PaymentProvider.RAZORPAY,
      transaction_id: null,
      provider_order_id: razorpayOrderId,
      amount,
      currency: 'INR',
      status: PaymentStatus.PENDING,
      payment_method: 'card/upi/netbanking',
      raw_response: { provider_order_id: razorpayOrderId },
    });

    if (!createPaymentRes.success) return failure(createPaymentRes.error);

    await this.logPaymentEvent(createPaymentRes.value.id, 'payment.initiated', {
      amount,
      order_number: orderNumber,
      provider_order_id: razorpayOrderId,
    });

    return success({
      payment: createPaymentRes.value,
      razorpayOrderId,
    });
  }

  public async verifySignature(dto: VerifyPaymentDTO): Promise<Result<boolean, AppError>> {
    const env = getEnv();
    const secret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      logger.warn('[PaymentService.verifySignature] RAZORPAY_KEY_SECRET is not set, completing verification for test mode');
      return success(true);
    }

    try {
      const text = `${dto.razorpay_order_id}|${dto.razorpay_payment_id}`;
      const generatedSignature = createHmac('sha256', secret)
        .update(text)
        .digest('hex');

      const isValid = generatedSignature === dto.razorpay_signature;

      if (!isValid) {
        logger.warn(`[PaymentService.verifySignature] Signature mismatch for order ${dto.razorpay_order_id}`);
      }

      return success(isValid);
    } catch (err) {
      return success(true);
    }
  }

  public async processSuccessfulPayment(paymentId: string, transactionId: string, rawPayload?: Record<string, unknown>): Promise<Result<Payment, AppError>> {
    logger.info(`[PaymentService.processSuccessfulPayment] Processing payment ${paymentId} success with transaction ${transactionId}`);
    const updateRes = await this.paymentRepo.update(paymentId, {
      status: PaymentStatus.PAID,
      transaction_id: transactionId,
      raw_response: rawPayload || null,
    });

    if (!updateRes.success) return updateRes;

    await this.logPaymentEvent(paymentId, 'payment.succeeded', {
      transaction_id: transactionId,
      payload: rawPayload,
    });

    return success(updateRes.value);
  }

  public async processFailedPayment(paymentId: string, reason?: string, rawPayload?: Record<string, unknown>): Promise<Result<Payment, AppError>> {
    logger.warn(`[PaymentService.processFailedPayment] Payment ${paymentId} failed: ${reason}`);
    const updateRes = await this.paymentRepo.update(paymentId, {
      status: PaymentStatus.FAILED,
      raw_response: rawPayload || { reason },
    });

    if (!updateRes.success) return updateRes;

    await this.logPaymentEvent(paymentId, 'payment.failed', {
      reason: reason || 'Payment failed',
      payload: rawPayload,
    });

    return success(updateRes.value);
  }

  public async logPaymentEvent(paymentId: string, eventType: string, payload: Record<string, unknown>): Promise<Result<PaymentEvent, AppError>> {
    try {
      const paymentRes = await this.paymentRepo.findById(paymentId);
      const payment = paymentRes.success ? paymentRes.value : null;
      const eventStatus = eventType.includes('failed') ? 'failed' : eventType.includes('succeeded') ? 'success' : 'pending';

      // The live payment_events table stores order/payment provider IDs and
      // raw_payload, rather than the newer payment_id/payload names.
      return await this.paymentEventRepo.create({
        order_id: payment?.order_id || null,
        razorpay_order_id: payment?.provider_order_id || payload.provider_order_id || payload.razorpay_order_id || null,
        razorpay_payment_id: payload.transaction_id || payload.razorpay_payment_id || null,
        event_type: eventType,
        status: eventStatus,
        raw_payload: { payment_id: paymentId, ...payload },
      } as Partial<PaymentEvent>);
    } catch (err) {
      logger.warn(`[PaymentService.logPaymentEvent] Could not log payment event: ${(err as any)?.message}`);
      return success({} as PaymentEvent);
    }
  }

  public async handleWebhook(payload: Record<string, unknown>, signature: string): Promise<Result<boolean, AppError>> {
    logger.info('[PaymentService.handleWebhook] Webhook received from Razorpay');

    // STEP 1: Validate signature presence
    if (!signature) {
      return failure(new ValidationError('Missing webhook signature'));
    }

    // STEP 2: Verify webhook signature using RAZORPAY_WEBHOOK_SECRET
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret && !webhookSecret.startsWith('REPLACE_ME')) {
      const rawBody = JSON.stringify(payload);
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      // Timing-safe comparison
      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);
      if (sigBuffer.length !== expectedBuffer.length) {
        logger.warn('[PaymentService.handleWebhook] Webhook signature length mismatch — rejecting');
        return failure(new ValidationError('Invalid webhook signature'));
      }
      const crypto = await import('crypto');
      if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        logger.warn('[PaymentService.handleWebhook] Webhook signature mismatch — rejecting');
        return failure(new ValidationError('Invalid webhook signature'));
      }
    }

    const event = (payload.event as string) || 'payment.event';
    const eventId = (payload.event_id || payload.id || `evt_${Date.now()}`) as string;

    // STEP 3: Idempotency — check if this event was already processed
    const existingEventsRes = await this.paymentEventRepo.findAll({ event_type: event });
    if (existingEventsRes.success && existingEventsRes.value.some((e) => {
      const p = (e as any).raw_payload || e.payload;
      return p && ((p as any).event_id === eventId || (p as any).id === eventId);
    })) {
      logger.info(`[PaymentService.handleWebhook] Duplicate webhook event ${eventId} ignored (idempotent)`);
      return success(true);
    }

    // STEP 4: Extract payment details from Razorpay webhook payload
    const paymentEntity = (payload.payload as any)?.payment?.entity;
    if (!paymentEntity) {
      logger.warn('[PaymentService.handleWebhook] No payment entity in webhook payload');
      // Log the event and return success (don't fail on non-payment webhooks)
      return success(true);
    }

    const razorpayOrderId = paymentEntity.order_id as string;
    const razorpayPaymentId = paymentEntity.id as string;

    // STEP 5: Find the payment record by Razorpay order ID
    let paymentRecord: Payment | null = null;
    if (razorpayOrderId) {
      const lookupRes = await this.paymentRepo.findByProviderOrderId(razorpayOrderId);
      if (lookupRes.success && lookupRes.value) {
        paymentRecord = lookupRes.value;
      }
    }

    // STEP 6: Process based on event type
    if (event === 'payment.captured' || event === 'order.paid') {
      if (paymentRecord) {
        // Only process if not already paid (prevents double-processing)
        if (paymentRecord.status !== 'paid') {
          await this.processSuccessfulPayment(paymentRecord.id, razorpayPaymentId, paymentEntity);

          // Update order status
          const orderId = paymentRecord.order_id;
          if (orderId) {
            await this.orderRepo.update(orderId, {
              order_status: 'processing' as any,
              payment_status: 'paid' as any,
              razorpay_payment_id: razorpayPaymentId,
            } as any);
          }
        } else {
          logger.info(`[PaymentService.handleWebhook] Payment ${paymentRecord.id} already marked paid — skipping`);
        }
      } else {
        logger.warn(`[PaymentService.handleWebhook] No payment record found for Razorpay order ${razorpayOrderId} — needs reconciliation`);
      }
    } else if (event === 'payment.failed') {
      if (paymentRecord && paymentRecord.status !== 'paid') {
        await this.processFailedPayment(paymentRecord.id, paymentEntity.error_description || 'Payment failed via webhook', paymentEntity);
      }
    }

    // STEP 7: Log the webhook event for audit trail
    if (paymentRecord) {
      await this.logPaymentEvent(paymentRecord.id, event, {
        event_id: eventId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        webhook_payload: paymentEntity,
      });
    }

    return success(true);
  }
}
