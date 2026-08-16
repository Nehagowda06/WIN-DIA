"use client";

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import styles from './register.module.css';

const TAGLINES = [
  'Naturally Fibre-Rich',
  'Rooted in Purity',
  'Crafted for Wellness',
  'Nourish, Naturally',
];

function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const otpRefs = useRef([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const prefill = searchParams.get('email');
    if (prefill) {
      setForm((prev) => ({ ...prev, email: prefill }));
    }
  }, [searchParams]);

  /* === Step 1: submit details, trigger OTP === */
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Something went wrong. Please try again.');
        return;
      }

      setStep(2);
    } catch (err) {
      console.error('Register error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* === Google OAuth sign-in/sign-up === */
  const handleGoogleSignIn = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Google sign-in error:', error.message);
      setError('Could not sign in with Google. Please try again.');
    }
  };

  /* === Step 2: OTP box handling === */
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (otpDigits.some((d) => d === '')) {
      setError('Please enter all 4 digits.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          otp_code: otpDigits.join(''),
          purpose: 'register',
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Incorrect code. Please try again.');
        return;
      }

      router.push('/');
    } catch (err) {
      console.error('Verify error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, purpose: 'register' }),
      });
    } catch (err) {
      console.error('Resend error:', err);
      setError('Could not resend code. Please try again.');
    }
  };

  const otpComplete = otpDigits.every((d) => d !== '');

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* === Form panel === */}
        <div className={styles.formPanel}>
          <div className={styles.stepDots}>
            <div className={`${styles.dot} ${styles.dotActive}`} />
            <div className={`${styles.dot} ${step === 2 ? styles.dotActive : ''}`} />
          </div>

          {step === 1 ? (
            <>
              <h1 className={styles.title}>Join WINDIA</h1>
              <p className={styles.subtitleMuted}>Step 1 of 2 — your details</p>

              <form onSubmit={handleDetailsSubmit}>
                <input
                  type="text"
                  placeholder="Full name"
                  className={styles.input}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className={styles.input}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  className={styles.input}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className={styles.input}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Please wait...' : 'CONTINUE'}
                </button>
              </form>

              <div className={styles.orDivider}>
                <span>or</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className={styles.googleBtn}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                Continue with Google
              </button>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Verify your email</h1>
              <p className={styles.subtitle}>Step 2 of 2 — enter the code</p>
              <p className={styles.subtitleMuted}>Sent to {form.email}</p>

              <form onSubmit={handleVerify}>
                <div className={styles.otpRow}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={styles.otpBox}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>

                <p className={styles.resendRow}>
                  Didn't get it?{' '}
                  <button type="button" className={styles.resendLink} onClick={handleResend}>
                    Resend OTP
                  </button>
                </p>

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.submitBtn} disabled={loading || !otpComplete}>
                  {loading ? 'Verifying...' : 'VERIFY & CREATE ACCOUNT'}
                </button>
              </form>

              <button type="button" className={styles.backLink} onClick={() => setStep(1)}>
                Back to details
              </button>
            </>
          )}

          <p className={styles.footer}>
            Already have an account? <a href="/login" className={styles.linkAccent}>Log in</a>
          </p>
        </div>

        {/* === Brand panel: animated, replaces video === */}
        <div className={styles.brandPanel}>
          <div className={styles.brandPattern} aria-hidden="true">
            <span className={styles.leaf}></span>
            <span className={styles.leaf}></span>
            <span className={styles.leaf}></span>
            <span className={styles.leaf}></span>
            <span className={styles.leaf}></span>
          </div>

          <div className={styles.brandContent}>
            <p className={styles.brandLogo}>WINDIA</p>
            <p key={taglineIndex} className={styles.brandTagline}>
              {TAGLINES[taglineIndex]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}