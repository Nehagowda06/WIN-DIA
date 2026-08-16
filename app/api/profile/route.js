import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/* === GET current user's profile === */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}

/* === PUT: update full_name / phone (email is not editable here) === */
export async function PUT(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { full_name, phone } = await request.json();

    /* === Reject if phone is taken by someone else === */
    if (phone) {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .neq('id', user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'This phone number is already in use.' }, { status: 409 });
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, phone, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ profile: updated });
  } catch (err) {
    console.error('Profile PUT error:', err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}