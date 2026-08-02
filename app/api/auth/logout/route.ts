import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { AuthService } from '@/src/backend/services/auth.service';
import { getAuthUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function POST(request: Request) {
  try {
    const authRes = await getAuthUserContext(request);
    const userId = authRes.success ? authRes.value.id : 'guest';

    const authService = container.resolve<AuthService>(ServiceTokens.AuthService);
    const result = await authService.logout(userId);

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
