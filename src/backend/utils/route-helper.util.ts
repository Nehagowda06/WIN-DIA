import { NextResponse } from 'next/server';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { createErrorResponse, createSuccessResponse } from '../types/api-response.types';
import { formatGlobalError } from '../middleware/error-handler.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin-auth.middleware';
import { UserContext } from '../types/common.types';

export async function getAuthUserContext(request: Request): Promise<Result<UserContext, AppError>> {
  const authHeader = request.headers.get('authorization');
  return authenticateToken(authHeader);
}

export async function getAdminUserContext(request: Request): Promise<Result<UserContext, AppError>> {
  const authRes = await getAuthUserContext(request);
  if (!authRes.success) return authRes;

  const adminRes = requireAdmin(authRes.value);
  if (!adminRes.success) return failure(adminRes.error);

  return success(authRes.value);
}

export function handleServiceResult<T>(
  result: Result<T, AppError>,
  successStatus: number = 200,
  message?: string
): NextResponse {
  if (result.success) {
    return NextResponse.json(createSuccessResponse(result.value, message), { status: successStatus });
  }

  const formatted = formatGlobalError(result.error);
  return NextResponse.json(
    createErrorResponse(formatted.errorCode, formatted.message, formatted.details),
    { status: formatted.statusCode }
  );
}
