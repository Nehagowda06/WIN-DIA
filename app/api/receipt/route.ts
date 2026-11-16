import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/receipt?token=<tracking_token>
 *
 * Returns order + order_items for the customer receipt page.
 * Authenticated by tracking_token — the same opaque column used by /api/track.
 * No login required; the token itself is the credential.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only — never sent to client
  );

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      order_number,
      created_at,
      items_price,
      discount_price,
      shipping_price,
      total_price,
      payment_status,
      payment_method,
      shipping_address,
      order_items (
        name,
        flavor,
        qty,
        price
      )
    `)
    .eq('tracking_token', token)
    .maybeSingle();

  if (error) {
    console.error('[receipt] Supabase error:', error.message);
  }

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(order);
}
