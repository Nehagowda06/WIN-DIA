import { NextResponse } from 'next/server';
import { ServiceTokens } from '@/src/backend/providers/container.provider';
import { WishlistService } from '@/src/backend/services/wishlist.service';
import { getAuthUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

/* ============================================================
   SHARED HELPERS
   ============================================================ */

/**
 * Resolves the authenticated user context and the WishlistService
 * together, since every handler in this file needs both. Returns
 * either { ok: true, userId, wishlistService } or { ok: false, response }
 * — callers just return `response` directly on failure.
 */
async function getWishlistContext(request: Request) {
  const authRes = await getAuthUserContext(request);
  if (!authRes.success) {
    return { ok: false as const, response: handleServiceResult(authRes) };
  }

  const wishlistService = authRes.value.scope.resolve<WishlistService>(ServiceTokens.WishlistService);
  return { ok: true as const, userId: authRes.value.id, wishlistService };
}

/**
 * Wraps a handler body so every route shares the same try/catch and
 * the same shape of "unexpected error" response, instead of each
 * function repeating its own try/catch block.
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

function normalizeWishlistItems(items: any[]) {
  return items.map((item: any) => ({
    ...item,
    _id: item.id,
    productId: item.product_id || item.productId,
    product: item.product || item,
  }));
}

/* ============================================================
   ROUTE HANDLERS
   ============================================================ */

export const GET = withErrorHandling(async (request: Request) => {
  const ctx = await getWishlistContext(request);
  if (!ctx.ok) return ctx.response;

  const result = await ctx.wishlistService.getWishlist(ctx.userId);
  if (!result.success) {
    return handleServiceResult(result);
  }

  const normalizedWishlist = normalizeWishlistItems(result.value || []);

  return NextResponse.json({
    success: true,
    wishlist: normalizedWishlist,
    data: normalizedWishlist,
  });
});

export const POST = withErrorHandling(async (request: Request) => {
  const ctx = await getWishlistContext(request);
  if (!ctx.ok) return ctx.response;

  const body = await request.json().catch(() => ({}));
  const productId = body.productId || body.product_id;

  if (!productId) {
    return NextResponse.json(
      createErrorResponse('VALIDATION_ERROR', 'productId is required'),
      { status: 400 }
    );
  }

  const result = await ctx.wishlistService.addToWishlist(ctx.userId, productId);
  return handleServiceResult(result, 201);
});

export const DELETE = withErrorHandling(async (request: Request) => {
  const ctx = await getWishlistContext(request);
  if (!ctx.ok) return ctx.response;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId') || searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json(
      createErrorResponse('VALIDATION_ERROR', 'productId query parameter is required'),
      { status: 400 }
    );
  }

  const result = await ctx.wishlistService.removeFromWishlist(ctx.userId, productId);
  return handleServiceResult(result);
});