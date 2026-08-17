import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { SettingsService } from '@/src/backend/services/settings.service';
import { getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

/* ============================================================
   SHARED HELPERS
   ============================================================ */

function getSettingsService() {
  return container.resolve<SettingsService>(ServiceTokens.SettingsService);
}

/**
 * Wraps a handler so every route shares the same try/catch and the
 * same "unexpected error" response shape.
 */
function withErrorHandling(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (err: any) {
      return NextResponse.json(
        createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
        { status: 500 }
      );
    }
  };
}

/* ============================================================
   ROUTE HANDLERS
   ============================================================ */

// Public: returns one setting by key, or all public settings if no key given.
export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const settingsService = getSettingsService();

  if (key) {
    const result = await settingsService.getSettingByKey(key);
    return handleServiceResult(result);
  }

  const result = await settingsService.getPublicSettings();
  return handleServiceResult(result);
});

// Admin-only: updates a single setting.
export const PUT = withErrorHandling(async (request: Request) => {
  const adminRes = await getAdminUserContext(request);
  if (!adminRes.success) {
    return handleServiceResult(adminRes);
  }

  const body = await request.json().catch(() => ({}));
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json(
      createErrorResponse('VALIDATION_ERROR', 'key and value are required'),
      { status: 400 }
    );
  }

  const settingsService = getSettingsService();
  const result = await settingsService.updateSetting(key, value);

  return handleServiceResult(result);
});