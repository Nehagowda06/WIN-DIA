import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { AuthService } from '@/src/backend/services/auth.service';
import { handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { applyRateLimit } from '@/src/backend/utils/rate-limiter.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'auth_reset_password', 3, 60);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Email is required'),
        { status: 400 }
      );
    }

    const authService = container.resolve<AuthService>(ServiceTokens.AuthService);
    const result = await authService.passwordReset(email);

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
