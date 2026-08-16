import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateOtp, getOtpExpiry } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/email/sendOtpEmail';

const RESEND_COOLDOWN_SECONDS = 30;

export async function POST(request) {
  try {
    const { email, purpose } = await request.json();
    const supabaseAdmin = createSupabaseAdminClient();

    /* === Cooldown: block spamming resend === */
    const { data: last } = await supabaseAdmin
      .from('otp_verifications')
      .select('created_at, user_id')
      .eq('email', email)
      .eq('purpose', purpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (last) {
      const secondsSince = (Date.now() - new Date(last.created_at).getTime()) / 1000;
      if (secondsSince < RESEND_COOLDOWN_SECONDS) {
        return NextResponse.json(
          { error: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince)}s before resending.` },
          { status: 429 }
        );
      }
    }

    /* === Resolve the actual user_id — fall back to profiles lookup if no prior OTP record === */
    let userId = last?.user_id ?? null;

    if (!userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      userId = profile?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'No account found for this email.' }, { status: 404 });
    }

    const otp = generateOtp();

    const { error: otpError } = await supabaseAdmin.from('otp_verifications').insert({
      user_id: userId,
      email,
      otp_code: otp,
      purpose,
      expires_at: getOtpExpiry(),
    });

    if (otpError) {
      return NextResponse.json({ error: otpError.message }, { status: 400 });
    }

    await sendOtpEmail({ to: email, otp, purpose });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Resend-otp route error:', err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}