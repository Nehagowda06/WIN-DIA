import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/src/frontend/lib/supabase/admin';
import { generateOtp, getOtpExpiry } from '@/src/frontend/lib/auth/otp';
import { sendOtpEmail } from '@/src/frontend/lib/email/sendOtpEmail';

export async function POST(request) {
  try {
    const { email } = await request.json();
    const supabaseAdmin = createSupabaseAdminClient();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ success: true });
    }

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