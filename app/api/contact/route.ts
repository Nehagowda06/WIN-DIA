import { NextResponse } from 'next/server';
import { container, ServiceTokens } from '@/src/backend/providers/container.provider';
import { ContactService } from '@/src/backend/services/contact.service';
import { getAdminUserContext, handleServiceResult } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';

function handleUnexpectedError(err: any) {
  return NextResponse.json(
    createErrorResponse('INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred'),
    { status: 500 }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const contactService = container.resolve<ContactService>(ServiceTokens.ContactService);
    const result = await contactService.submitMessage(body);

    return handleServiceResult(result, 201);
  } catch (err: any) {
    return handleUnexpectedError(err);
  }
}

export async function GET(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const contactService = container.resolve<ContactService>(ServiceTokens.ContactService);
    const result = await contactService.listMessages();

    return handleServiceResult(result);
  } catch (err: any) {
    return handleUnexpectedError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const adminRes = await getAdminUserContext(request);
    if (!adminRes.success) {
      return handleServiceResult(adminRes);
    }

    const body = await request.json().catch(() => ({}));
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'id and status are required'),
        { status: 400 }
      );
    }

    const contactService = container.resolve<ContactService>(ServiceTokens.ContactService);
    const result = await contactService.updateStatus(id, status);

    return handleServiceResult(result);
  } catch (err: any) {
    return handleUnexpectedError(err);
  }
}