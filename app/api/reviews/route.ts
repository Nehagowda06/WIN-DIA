import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { ReviewService } from '@/src/backend/services/review.service';
import { getAuthUserContext, getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(request: Request) {
  try {
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
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await getAuthUserContext(request);
    if (!authRes.success) {
      return handleServiceResult(authRes);
    }

    const body = await request.json().catch(() => ({}));
    const reviewService = authRes.value.scope.resolve<ReviewService>(ServiceTokens.ReviewService);
    const result = await reviewService.submitReview(authRes.value.id, body);

    return handleServiceResult(result, 201);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
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
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
