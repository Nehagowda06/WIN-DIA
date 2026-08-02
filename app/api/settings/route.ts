import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { SettingsService } from '@/src/backend/services/settings.service';
import { getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const settingsService = container.resolve<SettingsService>(ServiceTokens.SettingsService);

    if (key) {
      const result = await settingsService.getSettingByKey(key);
      return handleServiceResult(result);
    }

    const result = await settingsService.getPublicSettings();
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
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'key and value are required'),
        { status: 400 }
      );
    }

    const settingsService = container.resolve<SettingsService>(ServiceTokens.SettingsService);
    const result = await settingsService.updateSetting(key, value);

    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
