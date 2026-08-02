import { createErrorResponse } from '../types/api-response.types';
import { formatGlobalError } from '../middleware/error-handler.middleware';

export type AsyncRouteHandler<TArgs extends any[] = any[], TResult = any> = (
  ...args: TArgs
) => Promise<TResult>;

/**
 * Reusable async handler wrapper for Next.js Route Handlers / API endpoints.
 * Catches unhandled promise rejections and returns standardized error responses.
 */
export function asyncHandler<TArgs extends any[] = any[], TResult = any>(
  fn: AsyncRouteHandler<TArgs, TResult>
): (...args: TArgs) => Promise<TResult | Response> {
  return async (...args: TArgs): Promise<TResult | Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      const formatted = formatGlobalError(error);
      const errorBody = createErrorResponse(
        formatted.errorCode,
        formatted.message,
        formatted.details,
        undefined,
        formatted.stack
      );

      if (typeof Response !== 'undefined') {
        return new Response(JSON.stringify(errorBody), {
          status: formatted.statusCode,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      throw error;
    }
  };
}
