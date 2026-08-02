import { AppError } from '../errors/app-error';
import { ErrorCode, HttpStatus, HttpStatusCode } from '../constants/http-status.constants';
import { logger } from '../utils/logger.util';

export interface FormattedError {
  statusCode: HttpStatusCode;
  errorCode: string;
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * Normalizes any thrown error (AppError, native Error, ZodError, unknown) into FormattedError
 */
export function formatGlobalError(error: unknown): FormattedError {
  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error(`[CRITICAL] Non-operational AppError: ${error.message}`, error);
    } else {
      logger.warn(`Operational AppError: ${error.message}`, { errorCode: error.errorCode });
    }

    return {
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      message: error.message,
      details: error.details,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  if (error instanceof Error) {
    logger.error(`[UNHANDLED] System Error: ${error.message}`, error);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred' : error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  logger.error('[UNHANDLED] Unknown error payload received', error);
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
    message: 'An unexpected internal error occurred',
  };
}
