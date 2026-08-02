import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { UserService } from '@/src/backend/services/user.service';
import { getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('id');

    const userService = container.resolve<UserService>(ServiceTokens.UserService);

    if (userId) {
      const result = await userService.getProfile(userId);
      return handleServiceResult(result);
    }

    const result = await userService.getProfile(adminRes.value.id);
    return handleServiceResult(result);
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
    const { userId, ...dto } = body;

    if (!userId) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'userId is required for update'),
        { status: 400 }
      );
    }

    const userService = container.resolve<UserService>(ServiceTokens.UserService);
    const result = await userService.updateProfile(userId, dto);

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
