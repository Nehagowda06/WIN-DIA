import { NextResponse } from 'next/server';
import { ServiceTokens } from '@/src/backend/providers/container.provider';
import { WishlistService } from '@/src/backend/services/wishlist.service';
import { getAuthUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(request: Request) {
  try {
    const authRes = await getAuthUserContext(request);
    if (!authRes.success) {
      return handleServiceResult(authRes);
    }

    const wishlistService = authRes.value.scope.resolve<WishlistService>(ServiceTokens.WishlistService);
    const result = await wishlistService.getWishlist(authRes.value.id);

    if (!result.success) {
      return handleServiceResult(result);
    }

    const items = result.value || [];
    const normalizedWishlist = items.map((item: any) => ({
      ...item,
      _id: item.id,
      productId: item.product_id || item.productId,
      product: item.product || item,
    }));

    return NextResponse.json({
      success: true,
      wishlist: normalizedWishlist,
      data: normalizedWishlist,
    });
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
    const productId = body.productId || body.product_id;

    if (!productId) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'productId is required'),
        { status: 400 }
      );
    }

    const wishlistService = authRes.value.scope.resolve<WishlistService>(ServiceTokens.WishlistService);
    const result = await wishlistService.addToWishlist(authRes.value.id, productId);

    return handleServiceResult(result, 201);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authRes = await getAuthUserContext(request);
    if (!authRes.success) {
      return handleServiceResult(authRes);
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'productId query parameter is required'),
        { status: 400 }
      );
    }

    const wishlistService = authRes.value.scope.resolve<WishlistService>(ServiceTokens.WishlistService);
    const result = await wishlistService.removeFromWishlist(authRes.value.id, productId);

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
