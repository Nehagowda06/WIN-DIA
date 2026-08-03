import { NextResponse } from 'next/server';
import { ServiceTokens } from '@/src/backend/providers/container.provider';
import { UserService } from '@/src/backend/services/user.service';
import { getAuthUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(request: Request) {
  try {
    const authRes = await getAuthUserContext(request);
    if (!authRes.success) {
      return handleServiceResult(authRes);
    }

    const userService = authRes.value.scope.resolve<UserService>(ServiceTokens.UserService);
    const result = await userService.getProfile(authRes.value.id);

    if (!result.success) {
      return handleServiceResult(result);
    }

    return NextResponse.json({
      success: true,
      profile: result.value,
      data: result.value,
    });
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authRes = await getAuthUserContext(request);
    if (!authRes.success) {
      return handleServiceResult(authRes);
    }

    const body = await request.json().catch(() => ({}));
    const userService = authRes.value.scope.resolve<UserService>(ServiceTokens.UserService);
    const result = await userService.updateProfile(authRes.value.id, body);

    if (!result.success) {
      return handleServiceResult(result);
    }

    return NextResponse.json({
      success: true,
      profile: result.value,
      data: result.value,
    });
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
