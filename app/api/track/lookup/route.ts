import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDtdcTracking } from '../../../../src/backend/lib/dtdc-tracking';

export const dynamic = 'force-dynamic';

// Best-effort rate limit (per server instance) to slow down guessing.
const hits = new Map<string, { count: number; reset: number }>();
function isLimited(ip: string) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || rec.reset < now) {
    hits.set(ip, { count: 1, reset: now + 10 * 60 * 1000 });
    return false;
  }
  rec.count += 1;
  return rec.count > 10;
}

const last10 = (v: unknown) => String(v ?? '').replace(/\D/g, '').slice(-10);

function getAddress(order: any): any {
  const a = order.shipping_address;
  if (typeof a === 'string') {
    try { return JSON.parse(a); } catch { return {}; }
  }
  return a || {};
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const orderNumber = String(body.orderNumber ?? '').trim().replace(/^#/, '');
  const phone = last10(body.phone);

  if (!orderNumber || phone.length < 10) {
    return NextResponse.json(
      { error: 'Enter your order number and the 10-digit phone number used at checkout.' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
  );

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .in('order_number', [orderNumber, orderNumber.toUpperCase()])
    .limit(2);

  if (error) console.error('[track/lookup] Supabase error:', error.message);

  // Same generic answer whether the order number or the phone is wrong.
  const order = (orders || []).find((o: any) => {
    const addr = getAddress(o);
    return [addr.phone, o.customer_phone, o.phone].some((p) => last10(p) === phone);
  });

  if (error || !order) {
    return NextResponse.json(
      { error: 'We could not find an order with these details. Please check and try again.' },
      { status: 404 }
    );
  }

  const base = {
    orderNumber: order.order_number,
    orderStatus: order.order_status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
  };

  if (order.order_status === 'cancelled') {
    return NextResponse.json({ ...base, awb: null, step: null, label: 'Order cancelled', issue: false, events: [] });
  }

  if (!order.awb_code) {
    return NextResponse.json({ ...base, awb: null, step: 'confirmed', label: 'Order confirmed', issue: false, events: [] });
  }

  try {
    const t = await getDtdcTracking(order.awb_code);
    return NextResponse.json({
      ...base,
      awb: order.awb_code,
      step: t.step,
      label: t.label,
      issue: t.issue,
      events: t.events,
      expectedDelivery: t.expectedDelivery,
    });
  } catch (e: any) {
    console.error('[track/lookup] DTDC error:', e?.message);
    return NextResponse.json({
      ...base, awb: order.awb_code, step: 'confirmed', label: 'Booked with courier', issue: false, events: [],
    });
  }
}