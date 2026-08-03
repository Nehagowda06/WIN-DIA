import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { CartService } from '@/src/backend/services/cart.service';
import { getAuthUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const authRes = await getAuthUserContext(request);
    const userId = authRes.success ? authRes.value.id : undefined;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || undefined;

    const scope = authRes.success ? authRes.value.scope : container.createRequestScope(authHeader || undefined);
    const cartService = scope.resolve<CartService>(ServiceTokens.CartService);
    const result = await cartService.getCart(userId, sessionId);

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
    const authHeader = request.headers.get('authorization');
    const body = await request.json().catch(() => ({}));
    // Accept product_id directly; fall back to variant_id for backwards-compat
    // (cart_items.variant_id physically stores product_id in this architecture)
    const { cart_id, product_id, variant_id, quantity } = body;
    const resolvedProductId = product_id ?? variant_id;

    if (!cart_id || !resolvedProductId) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'cart_id and product_id are required'),
        { status: 400 }
      );
    }

    const scope = container.createRequestScope(authHeader || undefined);
    const cartService = scope.resolve<CartService>(ServiceTokens.CartService);
    const result = await cartService.addItem(cart_id, {
      product_id: resolvedProductId,
      quantity: parseInt(quantity || '1', 10),
    });

    return handleServiceResult(result, 201);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json().catch(() => ({}));
    // Accept product_id directly; fall back to variant_id for backwards-compat
    const { cart_id, product_id, variant_id, quantity } = body;
    const resolvedProductId = product_id ?? variant_id;

    if (!cart_id || !resolvedProductId || quantity === undefined) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'cart_id, product_id and quantity are required'),
        { status: 400 }
      );
    }

    const scope = container.createRequestScope(authHeader || undefined);
    const cartService = scope.resolve<CartService>(ServiceTokens.CartService);
    const result = await cartService.updateItemQuantity(cart_id, resolvedProductId, {
      quantity: parseInt(quantity, 10),
    });

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId') || searchParams.get('cart_id');
    // Accept product_id or variant_id (backwards-compat) — both identify the product in this architecture
    const productId = searchParams.get('productId') || searchParams.get('product_id')
      || searchParams.get('variantId') || searchParams.get('variant_id');

    if (!cartId) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'cartId query parameter is required'),
        { status: 400 }
      );
    }

    const scope = container.createRequestScope(authHeader || undefined);
    const cartService = scope.resolve<CartService>(ServiceTokens.CartService);
    if (productId) {
      const result = await cartService.removeItem(cartId, productId);
      return handleServiceResult(result);
    }

    const result = await cartService.clearCart(cartId);
    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
