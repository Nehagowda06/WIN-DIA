import { NextResponse } from 'next/server';
import { ServiceTokens } from '@/src/backend/providers/container.provider';
import { CouponService } from '@/src/backend/services/coupon.service';
import { getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function POST(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const body = await request.json().catch(() => ({}));
    const couponService = adminRes.value.scope.resolve<CouponService>(ServiceTokens.CouponService);
    const result = await couponService.createCoupon(body);

    return handleServiceResult(result, 201);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'code query parameter is required'),
        { status: 400 }
      );
    }

    const couponService = adminRes.value.scope.resolve<CouponService>(ServiceTokens.CouponService);
    const result = await couponService.getCouponByCode(code);

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
