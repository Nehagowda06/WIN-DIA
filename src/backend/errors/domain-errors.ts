import { AppError } from './app-error';
import { ErrorCode, HttpStatus } from '../constants/http-status.constants';

/**
 * Validation Error (HTTP 400)
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, true, details);
  }
}

/**
 * Authentication Error (HTTP 401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: unknown) {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, true, details);
  }
}

/**
 * Authorization Error (HTTP 403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied', details?: unknown) {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, true, details);
  }
}

/**
 * Resource Not Found Error (HTTP 404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(message, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, true, details);
  }
}

/**
 * Conflict Error (HTTP 409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(message, HttpStatus.CONFLICT, ErrorCode.CONFLICT, true, details);
  }
}

/**
 * Inventory Error (HTTP 422)
 */
export class InventoryError extends AppError {
  constructor(message: string = 'Insufficient inventory', details?: unknown) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.INVENTORY_ERROR, true, details);
  }
}

/**
 * Payment Error (HTTP 400 or 422)
 */
export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing error', details?: unknown) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.PAYMENT_ERROR, true, details);
  }
}
