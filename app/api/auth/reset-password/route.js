import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/src/frontend/lib/supabase/admin';
import { MAX_OTP_ATTEMPTS } from '@/src/frontend/lib/auth/otp';

export async function POST(request) {
  try {
    const { email, otp_code, new_password } = await request.json();
    const supabaseAdmin = createSupabaseAdminClient();

    /* === Verify the OTP first, same rules as register verification === */
    const { data: record } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .eq('purpose', 'reset_password')
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!record) {
      return NextResponse.json({ error: 'No reset request found. Please try again.' }, { status: 400 });
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This code has expired. Please request a new one.' }, { status: 400 });
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new code.' }, { status: 429 });
    }

    if (record.otp_code !== otp_code) {
      await supabaseAdmin
        .from('otp_verifications')
        .update({ attempts: record.attempts + 1 })
        .eq('id', record.id);

      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }

    /* === Correct - mark verified, then actually update the password === */
    await supabaseAdmin
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', record.id);

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      record.user_id,
      { password: new_password }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    /* === Also clear any lockout so they can log in immediately === */
    await supabaseAdmin
      .from('profiles')
      .update({ failed_login_count: 0, locked_until: null })
      .eq('id', record.user_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset-password route error:', err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}