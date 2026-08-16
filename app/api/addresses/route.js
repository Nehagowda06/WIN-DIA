import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/* === GET: list all addresses for the current user === */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { data: addresses, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ addresses });
  } catch (err) {
    console.error('Addresses GET error:', err);
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 });
  }
}

/* === POST: create a new address === */
export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = body;

    if (is_default) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data: address, error } = await supabaseAdmin
      .from('addresses')
      .insert({
        user_id: user.id,
        full_name,
        phone,
        address_line1,
        address_line2: address_line2 || null,
        city,
        state,
        pincode,
        is_default: !!is_default,
      })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ address });
  } catch (err) {
    console.error('Addresses POST error:', err);
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 });
  }
}