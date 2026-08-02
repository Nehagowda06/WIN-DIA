import { PaginationDefaults } from '../constants/app.constants';
import { PaginatedApiResponse, PaginationMeta, createPaginatedResponse } from '../types/api-response.types';

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
}

/**
 * Calculates page, pageSize, offset, and limit for SQL queries and pagination
 */
export function calculatePagination(rawPage?: number | string, rawPageSize?: number | string): PaginationParams {
  const pageCandidate = typeof rawPage === 'string' ? parseInt(rawPage, 10) : rawPage;
  const pageSizeCandidate = typeof rawPageSize === 'string' ? parseInt(rawPageSize, 10) : rawPageSize;

  const page = pageCandidate && pageCandidate > 0 ? Math.floor(pageCandidate) : PaginationDefaults.DEFAULT_PAGE;

  const requestedSize = pageSizeCandidate && pageSizeCandidate > 0 ? Math.floor(pageSizeCandidate) : PaginationDefaults.DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(requestedSize, PaginationDefaults.MAX_PAGE_SIZE);

  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  return { page, pageSize, offset, limit };
}

/**
 * Builds standard PaginationMeta and PaginatedApiResponse object
 */
export function buildPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number,
  message?: string,
  requestId?: string
): PaginatedApiResponse<T> {
  const totalPages = Math.ceil(totalItems / (pageSize || 1)) || 1;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const paginationMeta: PaginationMeta = {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };

  return createPaginatedResponse(items, paginationMeta, message, requestId);
}
