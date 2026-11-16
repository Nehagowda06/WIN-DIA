/**
 * TEMPORARY TEST ROUTE — delete this file after email template testing is complete.
 *
 * Fetches the real order from Supabase by order_number, then sends both
 * notification emails using the actual tracking_token and order_items.
 * No manual payload is needed; the order must already exist in the database.
 *
 * Security:
 *   - Requires a valid Supabase JWT with profiles.role = 'admin'.
 *   - Customer confirmation is sent only to EMAIL_TEST_RECIPIENT.
 *   - Owner alert goes to ADMIN_ALERT_EMAIL || GMAIL_USER, as in production.
 */
import { NextResponse } from 'next/server';
import { getAdminUserContext } from '@/src/backend/utils/route-helper.util';
import { createErrorResponse } from '@/src/backend/types/api-response.types';
import { getAdminClient } from '@/src/backend/config/supabase.config';
import {
  sendOrderConfirmationEmail,
  sendAdminNewOrderAlert,
} from '@/src/backend/lib/email.js';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // 1. Admin authentication.
  const adminRes = await getAdminUserContext(request);
  if (!adminRes.success) {
    return NextResponse.json(
      createErrorResponse('UNAUTHORIZED', 'Admin authentication required'),
      { status: 401 }
    );
  }

  // 2. Recipient lock.
  const testRecipient = process.env.EMAIL_TEST_RECIPIENT;
  if (!testRecipient) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_SERVER_ERROR', 'EMAIL_TEST_RECIPIENT is not set in .env.local'),
      { status: 500 }
    );
  }

  // 3. Parse request — only the order_number is needed.
  const body = await request.json().catch(() => null);
  const orderNumber = body?.orderNumber as string | undefined;
  if (!orderNumber) {
    return NextResponse.json(
      createErrorResponse('VALIDATION_ERROR', '"orderNumber" is required'),
      { status: 400 }
    );
  }

  // 4. Fetch the real order and its items from Supabase.
  const db = getAdminClient();
  const { data: order, error } = await db
    .from('orders')
    .select(`
      order_number,
      created_at,
      total_price,
      items_price,
      discount_price,
      shipping_price,
      payment_method,
      payment_status,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      tracking_token,
      order_items ( name, flavor, qty, price )
    `)
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json(
      createErrorResponse('NOT_FOUND', `Order ${orderNumber} not found`),
      { status: 404 }
    );
  }

  // 5. Send both emails using the real order data.
  const [confirmationResult, adminAlertResult] = await Promise.allSettled([
    sendOrderConfirmationEmail(order, testRecipient),
    sendAdminNewOrderAlert(order),
  ]);

  return NextResponse.json({
    success: true,
    sentCustomerTo: testRecipient,
    trackingToken: order.tracking_token ?? null,
    results: {
      customerConfirmation:
        confirmationResult.status === 'fulfilled'
          ? confirmationResult.value
          : { sent: false, reason: (confirmationResult as PromiseRejectedResult).reason?.message ?? 'unknown' },
      adminAlert:
        adminAlertResult.status === 'fulfilled'
          ? adminAlertResult.value
          : { sent: false, reason: (adminAlertResult as PromiseRejectedResult).reason?.message ?? 'unknown' },
    },
  });
}
