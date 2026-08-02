/**
 * Generic Production API Response Types & Builders
 */

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SuccessApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: ResponseMeta;
}

export interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
  meta?: ResponseMeta;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

export interface ErrorApiResponse {
  success: false;
  error: ErrorDetails;
  meta?: ResponseMeta;
}

export type ApiResponse<T> = SuccessApiResponse<T> | ErrorApiResponse;
export type PaginatedResponse<T> = PaginatedApiResponse<T> | ErrorApiResponse;

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): SuccessApiResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  message?: string,
  requestId?: string
): PaginatedApiResponse<T> {
  return {
    success: true,
    data,
    pagination,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown,
  requestId?: string,
  stack?: string
): ErrorApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      stack,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}
