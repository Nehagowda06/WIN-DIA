import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateOtp, getOtpExpiry } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/email/sendOtpEmail';

export async function POST(request) {
  try {
    const { email } = await request.json();
    const supabaseAdmin = createSupabaseAdminClient();

    /* === Look up the profile === */
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!profile) {
      // Don't reveal whether the email exists — respond success either way
      return NextResponse.json({ success: true });
    }

    /* === Invalidate any old, unused reset OTPs for this email === */
    await supabaseAdmin
      .from('otp_verifications')
      .delete()
      .eq('email', email)
      .eq('purpose', 'reset_password')
      .is('used_at', null);

    /* === Generate + store the new OTP === */
    const otp = generateOtp();

    const { error: otpError } = await supabaseAdmin.from('otp_verifications').insert({
      user_id: profile.id,
      email,
      otp_code: otp,
      purpose: 'reset_password',
      expires_at: getOtpExpiry(),
    });

    if (otpError) {
      return NextResponse.json({ error: otpError.message }, { status: 400 });
    }

    await sendOtpEmail({ to: email, otp, purpose: 'reset_password' });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Forgot-password route error:', err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}