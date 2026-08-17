import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateOtp, getOtpExpiry } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/email/sendOtpEmail';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const { full_name, email, phone, password } = await request.json();

    /* === Basic input validation === */
    if (!full_name?.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    // TODO: add rate limiting per IP/email (e.g. Upstash Ratelimit) to prevent
    // this route being spammed to trigger repeated OTP emails.

    // NOTE: we intentionally do NOT use createSupabaseServerClient() for account
    // creation below. That client is bound to request/response cookies, so if
    // the Supabase project has "Confirm email" disabled, a client-side signUp()
    // call auto-confirms the user AND writes a live session into the browser's
    // cookies immediately — logging the user in before OTP verification ever runs.
    // We only need the server client later, to establish a session ourselves
    // once OTP succeeds (that already happens in verify-otp/route.js).
    const supabaseAdmin = createSupabaseAdminClient();

    /* === Check for an existing profile with this email or phone === */
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .maybeSingle();

    let userId;

    if (existingProfile) {
      /* === Profile exists — check if that auth account was ever confirmed === */
      const { data: existingAuthUser } = await supabaseAdmin.auth.admin.getUserById(existingProfile.id);

      if (existingAuthUser?.user?.email_confirmed_at) {
        return NextResponse.json(
          { error: 'An account with this email or phone already exists.' },
          { status: 409 }
        );
      }

      userId = existingProfile.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    } else {
      /* === No profile row — try a fresh signup via the ADMIN API ===
         admin.createUser() never touches request cookies, so no session
         is created here. email_confirm is explicitly false: the account
         stays unconfirmed (and therefore unable to log in) until the OTP
         step calls updateUserById({ email_confirm: true }). */
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      });

      if (createError) {
        const isDuplicateError =
          createError.message?.toLowerCase().includes('already registered') ||
          createError.code === 'email_exists' ||
          createError.code === 'user_already_exists';

        if (!isDuplicateError) {
          return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const orphanedUser = listData?.users?.find((u) => u.email === email);

        if (orphanedUser) {
          if (orphanedUser.email_confirmed_at) {
            return NextResponse.json(
              { error: 'An account with this email already exists.' },
              { status: 409 }
            );
          }
          /* === Unconfirmed orphan — reuse it, no profile row exists yet === */
          userId = orphanedUser.id;
          await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        } else {
          /* === Shouldn't normally happen, but fail safely if it does === */
          return NextResponse.json(
            { error: 'An account with this email already exists.' },
            { status: 409 }
          );
        }
      } else {
        userId = createData.user?.id;
      }
    }

    /* === Create/update the profile row === */
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        { id: userId, full_name, email, phone },
        { onConflict: 'id' }
      );

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    /* === Generate + store OTP === */
    const otp = generateOtp();

    const { error: otpError } = await supabaseAdmin.from('otp_verifications').insert({
      user_id: userId,
      email,
      otp_code: otp,
      purpose: 'register',
      expires_at: getOtpExpiry(),
    });

    if (otpError) {
      return NextResponse.json({ error: otpError.message }, { status: 400 });
    }

    await sendOtpEmail({ to: email, otp, purpose: 'register' });

    return NextResponse.json({ userId, email });
  } catch (err) {
    console.error('Register route error:', err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
