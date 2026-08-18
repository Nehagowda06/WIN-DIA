import { NextResponse } from 'next/server';
import { ServiceTokens } from '@/src/backend/providers/container.provider';
import { ProductService } from '@/src/backend/services/product.service';
import { getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const productService = adminRes.value.scope.resolve<ProductService>(ServiceTokens.ProductService);
    const result = await productService.listProducts({ page, pageSize });

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
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const body = await request.json().catch(() => ({}));
    const productService = adminRes.value.scope.resolve<ProductService>(ServiceTokens.ProductService);
    const result = await productService.createProduct(body);

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
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const body = await request.json().catch(() => ({}));
    const { id, ...dto } = body;

    if (!id) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Product ID is required for update'),
        { status: 400 }
      );
    }

    const productService = adminRes.value.scope.resolve<ProductService>(ServiceTokens.ProductService);
    const result = await productService.updateProduct(id, dto);

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
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Product id query parameter is required'),
        { status: 400 }
      );
    }

    const productService = adminRes.value.scope.resolve<ProductService>(ServiceTokens.ProductService);
    const result = await productService.deleteProduct(id);

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
