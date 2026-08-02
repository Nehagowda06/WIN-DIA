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

    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return failure(new PaymentError('Razorpay API credentials missing in environment'));
    }

    const mockRazorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const createPaymentRes = await this.paymentRepo.create({
      order_id: orderId,
      payment_provider: PaymentProvider.RAZORPAY,
      transaction_id: null,
      provider_order_id: mockRazorpayOrderId,
      amount,
      currency: 'INR',
      status: PaymentStatus.PENDING,
      payment_method: 'card/upi/netbanking',
      raw_response: { provider_order_id: mockRazorpayOrderId },
    });

    if (!createPaymentRes.success) return failure(createPaymentRes.error);

    await this.logPaymentEvent(createPaymentRes.value.id, 'payment.initiated', {
      amount,
      order_number: orderNumber,
      provider_order_id: mockRazorpayOrderId,
    });

    return success({
      payment: createPaymentRes.value,
      razorpayOrderId: mockRazorpayOrderId,
    });
  }

  public async verifySignature(dto: VerifyPaymentDTO): Promise<Result<boolean, AppError>> {
    const env = getEnv();
    if (!env.RAZORPAY_KEY_SECRET) {
      return failure(new PaymentError('Razorpay secret missing for signature verification'));
    }

    try {
      const text = `${dto.razorpay_order_id}|${dto.razorpay_payment_id}`;
      const generatedSignature = createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      const isValid = generatedSignature === dto.razorpay_signature;

      if (!isValid) {
        logger.warn(`[PaymentService.verifySignature] Signature mismatch for order ${dto.razorpay_order_id}`);
      }

      return success(isValid);
    } catch (err) {
      return failure(new PaymentError('Failed to verify Razorpay signature', err));
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
    return this.paymentEventRepo.create({
      payment_id: paymentId,
      event_type: eventType,
      payload,
    });
  }

  public async handleWebhook(payload: Record<string, unknown>, signature: string): Promise<Result<boolean, AppError>> {
    logger.info('[PaymentService.handleWebhook] Webhook received from Razorpay');
    if (!signature) {
      return failure(new ValidationError('Missing webhook signature'));
    }

    const event = payload.event as string;
    const eventId = (payload.event_id || payload.id || `evt_${Date.now()}`) as string;

    const existingEventsRes = await this.paymentEventRepo.findAll({ event_type: event });
    if (existingEventsRes.success && existingEventsRes.value.some((e) => e.payload && (e.payload as any).event_id === eventId)) {
      logger.info(`[PaymentService.handleWebhook] Duplicate webhook event ${eventId} ignored (idempotent)`);
      return success(true);
    }

    return success(true);
  }
}
