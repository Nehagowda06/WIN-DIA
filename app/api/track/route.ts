import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDtdcTracking } from '../../../src/backend/lib/dtdc-tracking';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!   // server only, never NEXT_PUBLIC_
  );

 const { data: order, error } = await supabase
  .from('orders')
  .select('*')
  .eq('tracking_token', token)
  .maybeSingle();

if (error) console.error('[track] Supabase error:', error.message);
if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (!order.awb_code) {
    return NextResponse.json({
      awb: null, step: 'confirmed', label: 'Order confirmed', issue: false,
      events: [], paymentStatus: order.payment_status,
    });
  }

  const t = await getDtdcTracking(order.awb_code);
  return NextResponse.json({
    awb: order.awb_code,
    step: t.step, label: t.label, issue: t.issue,
    events: t.events, expectedDelivery: t.expectedDelivery,
    paymentStatus: order.payment_status,
  });
}