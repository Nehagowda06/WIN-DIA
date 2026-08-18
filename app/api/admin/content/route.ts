import { NextResponse } from 'next/server';
import { ServiceTokens } from '@/src/backend/providers/container.provider';
import { CMSService } from '@/src/backend/services/cms.service';
import { getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

export async function GET(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const cmsService = adminRes.value.scope.resolve<CMSService>(ServiceTokens.CMSService);

    if (slug) {
      const result = await cmsService.getPageContent(slug);
      return handleServiceResult(result);
    }

    const result = await cmsService.getActiveBanners();
    return handleServiceResult(result);
  } catch (err: any) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
