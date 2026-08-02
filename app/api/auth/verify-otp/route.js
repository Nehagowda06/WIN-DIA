import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/src/frontend/lib/supabase/admin';
import { MAX_OTP_ATTEMPTS } from '@/src/frontend/lib/auth/otp';

export async function POST(request) {
  try {
    const { email, otp_code, purpose } = await request.json();
    const supabaseAdmin = createSupabaseAdminClient();

    /* === Fetch the latest unverified OTP for this email + purpose (admin client - bypasses RLS) === */
    const { data: record } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .eq('purpose', purpose)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!record) {
      return NextResponse.json({ error: 'No OTP request found. Please request a new one.' }, { status: 400 });
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new OTP.' }, { status: 429 });
    }

    if (record.otp_code !== otp_code) {
      await supabaseAdmin
        .from('otp_verifications')
        .update({ attempts: record.attempts + 1 })
        .eq('id', record.id);

      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }

    /* === Correct - mark verified === */
    await supabaseAdmin
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', record.id);

    /* === Register flow: confirm the auth user so they can log in === */
    if (purpose === 'register' && record.user_id) {
      await supabaseAdmin.auth.admin.updateUserById(record.user_id, { email_confirm: true });
    }

    return NextResponse.json({ success: true, user_id: record.user_id });
  } catch (err) {
    console.error('Verify-otp route error:', err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
