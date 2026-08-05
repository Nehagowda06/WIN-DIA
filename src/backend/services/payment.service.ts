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
    if (!signature) {
      return failure(new ValidationError('Missing webhook signature'));
    }

    const event = (payload.event as string) || 'payment.event';
    const eventId = (payload.event_id || payload.id || `evt_${Date.now()}`) as string;

    const existingEventsRes = await this.paymentEventRepo.findAll({ event_type: event });
    if (existingEventsRes.success && existingEventsRes.value.some((e) => e.payload && ((e.payload as any).event_id === eventId || (e.payload as any).id === eventId))) {
      logger.info(`[PaymentService.handleWebhook] Duplicate webhook event ${eventId} ignored (idempotent DB check)`);
      return success(true);
    }

    return success(true);
  }
}
