import { Payment } from '../models/domain-models.types';
import { PaymentProvider } from '../enums/entity.enums';
import { Result } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface PaymentService {
  initiatePayment(orderId: string, provider: PaymentProvider): Promise<Result<{ payment: Payment; checkoutDetails: Record<string, unknown> }, AppError>>;
  verifyPayment(paymentId: string, providerPayload: Record<string, unknown>): Promise<Result<Payment, AppError>>;
  handleWebhook(provider: PaymentProvider, payload: Record<string, unknown>, signature: string): Promise<Result<boolean, AppError>>;
  refundPayment(paymentId: string, amount?: number, reason?: string): Promise<Result<Payment, AppError>>;
}
