import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/* === PUT: update an existing address (also handles "set as default") === */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = body;

    const { data: existing } = await supabaseAdmin
      .from('addresses')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    }

    if (is_default) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data: address, error } = await supabaseAdmin
      .from('addresses')
      .update({
        full_name,
        phone,
        address_line1,
        address_line2: address_line2 || null,
        city,
        state,
        pincode,
        is_default: !!is_default,
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ address });
  } catch (err) {
    console.error('Address PUT error:', err);
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 });
  }
}

/* === DELETE: remove an address === */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { data: existing } = await supabaseAdmin
      .from('addresses')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from('addresses').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Address DELETE error:', err);
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 });
  }
}