import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { ReviewService } from '@/src/backend/services/review.service';
import { getAuthUserContext, getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

/**
 * Wraps a handler so every route shares the same try/catch and the
 * same "unexpected error" response shape. Does not touch anything
 * about each handler's own auth/logic — each one keeps exactly what
 * it had before.
 */
function withErrorHandling(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (err: any) {
      return NextResponse.json(
        createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
        { status: 500 }
      );
    }
  };
}

// Public: list reviews for a product. Uses a request-scoped container
// directly (no required auth) since anonymous visitors can view reviews.
export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId') || searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json(
      createErrorResponse('VALIDATION_ERROR', 'productId query parameter is required'),
      { status: 400 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const scope = container.createRequestScope(authHeader || undefined);
  const reviewService = scope.resolve<ReviewService>(ServiceTokens.ReviewService);
  const result = await reviewService.getProductReviews(productId);

  return handleServiceResult(result);
});

// Authenticated user: submit a new review.
export const POST = withErrorHandling(async (request: Request) => {
  const authRes = await getAuthUserContext(request);
  if (!authRes.success) {
    return handleServiceResult(authRes);
  }

  const body = await request.json().catch(() => ({}));
  const reviewService = authRes.value.scope.resolve<ReviewService>(ServiceTokens.ReviewService);
  const result = await reviewService.submitReview(authRes.value.id, body);

  return handleServiceResult(result, 201);
});

// Admin only: approve or reject a review.
export const PATCH = withErrorHandling(async (request: Request) => {
  const adminRes = await getAdminUserContext(request);
  if (!adminRes.success) {
    return handleServiceResult(adminRes);
  }

  const body = await request.json().catch(() => ({}));
  const { reviewId, action } = body;

  if (!reviewId) {
    return NextResponse.json(
      createErrorResponse('VALIDATION_ERROR', 'reviewId is required'),
      { status: 400 }
    );
  }

  const reviewService = adminRes.value.scope.resolve<ReviewService>(ServiceTokens.ReviewService);
  const result = action === 'reject'
    ? await reviewService.rejectReview(reviewId)
    : await reviewService.approveReview(reviewId);

  return handleServiceResult(result);
});