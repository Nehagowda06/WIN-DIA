import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { UserService } from '@/src/backend/services/user.service';
import { getAuthUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(request: Request) {
  try {
    const authRes = await getAuthUserContext(request);
    if (!authRes.success) {
      return handleServiceResult(authRes);
    }

    const userService = container.resolve<UserService>(ServiceTokens.UserService);
    const result = await userService.getUserAddresses(authRes.value.id);

    if (!result.success) {
      return handleServiceResult(result);
    }

    const normalizedAddresses = (result.value || []).map((a: any) => ({
      ...a,
      _id: a.id,
      name: a.full_name || a.name || '',
      street: a.address_line1 || a.street || '',
      isDefault: Boolean(a.is_default),
    }));

    return NextResponse.json({
      success: true,
      addresses: normalizedAddresses,
      data: normalizedAddresses,
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
    const userService = container.resolve<UserService>(ServiceTokens.UserService);
    const result = await userService.addAddress(authRes.value.id, body);

    if (!result.success) {
      return handleServiceResult(result);
    }

    const addr = result.value as any;
    const normalized = {
      ...addr,
      _id: addr.id,
      name: addr.full_name || addr.name || '',
      street: addr.address_line1 || addr.street || '',
      isDefault: Boolean(addr.is_default),
    };

    return NextResponse.json(
      {
        success: true,
        address: normalized,
        data: normalized,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
