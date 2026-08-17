import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/* === Shared helpers === */

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getOwnedAddress(supabaseAdmin, id, userId) {
  const { data: existing } = await supabaseAdmin
    .from('addresses')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();

  if (!existing || existing.user_id !== userId) return null;
  return existing;
}

function errorResponse(message, status) {
  return NextResponse.json({ error: message }, { status });
}

/* === PUT: update an existing address (also handles "set as default") === */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const supabaseAdmin = createSupabaseAdminClient();
    const user = await getAuthenticatedUser();

    if (!user) return errorResponse('Not authenticated.', 401);

    const owned = await getOwnedAddress(supabaseAdmin, id, user.id);
    if (!owned) return errorResponse('Address not found.', 404);

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

    if (error) return errorResponse(error.message, 400);

    return NextResponse.json({ address });
  } catch (err) {
    console.error('Address PUT error:', err);
    return errorResponse(err.message || 'Something went wrong.', 500);
  }
}

/* === DELETE: remove an address === */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const supabaseAdmin = createSupabaseAdminClient();
    const user = await getAuthenticatedUser();

    if (!user) return errorResponse('Not authenticated.', 401);

    const owned = await getOwnedAddress(supabaseAdmin, id, user.id);
    if (!owned) return errorResponse('Address not found.', 404);

    const { error } = await supabaseAdmin.from('addresses').delete().eq('id', id);

    if (error) return errorResponse(error.message, 400);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Address DELETE error:', err);
    return errorResponse(err.message || 'Something went wrong.', 500);
  }
}