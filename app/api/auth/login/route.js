import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/src/frontend/lib/supabase/server';
import { createSupabaseAdminClient } from '@/src/frontend/lib/supabase/admin';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminClient();

    /* === Check lockout status before attempting sign-in (admin client - bypasses RLS) === */
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, failed_login_count, locked_until')
      .eq('email', email)
      .maybeSingle();

    if (profile?.locked_until && new Date(profile.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(profile.locked_until) - new Date()) / 60000);
      return NextResponse.json(
        { error: `Account locked. Try again in ${minutesLeft} minute(s).` },
        { status: 423 }
      );
    }

    /* === Attempt sign-in === */
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (profile) {
        const newCount = (profile.failed_login_count || 0) + 1;
        const updates = { failed_login_count: newCount };

        if (newCount >= MAX_FAILED_ATTEMPTS) {
          updates.locked_until = new Date(Date.now() + LOCK_DURATION_MINUTES * 60000).toISOString();
        }

        await supabaseAdmin.from('profiles').update(updates).eq('id', profile.id);
      }

      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    /* === Success - reset failed attempts === */
    if (profile) {
      await supabaseAdmin
        .from('profiles')
        .update({ failed_login_count: 0, locked_until: null })
        .eq('id', profile.id);
    }

    return NextResponse.json({
      session: data.session,
    });
  } catch (err) {
    console.error('Login route error:', err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}