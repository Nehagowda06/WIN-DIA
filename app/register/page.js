"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/frontend/lib/supabase/client';
import styles from './register.module.css';

const TAGLINES = [
  'Naturally Fibre-Rich',
  'Rooted in Purity',
  'Crafted for Wellness',
  'Nourish, Naturally',
];

const EMPTY_DETAILS = { full_name: '', email: '', phone: '', password: '' };

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_DETAILS);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timers = [100, 600].map((delay) => window.setTimeout(() => setForm({ ...EMPTY_DETAILS }), delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

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

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        setError(signInError.message || 'Account created, but automatic sign in failed. Please log in.');
        return;
      }

      window.location.replace('/');
    } catch (err) {
      console.error('Register error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
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

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        router.push('/login');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.push('/login');
        return;
      }

      window.location.replace('/');
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

  const handleGoogleSignup = async () => {
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });

    if (oauthError) {
      setError(oauthError.message || 'Could not start Google sign up.');
    }
  };

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
              <p className={styles.subtitleMuted}>Step 1 of 2 - your details</p>

              <button type="button" className={styles.googleBtn} onClick={handleGoogleSignup}>
                <img src="/icons/google.svg" alt="" className={styles.googleIcon} />
                Continue with Google
              </button>

              <div className={styles.divider}><span>or</span></div>

              <form onSubmit={handleDetailsSubmit} autoComplete="off">
                <input
                  type="text"
                  name="windia_signup_full_name"
                  autoComplete="off"
                  placeholder="Full name"
                  className={styles.input}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  name="windia_signup_email"
                  autoComplete="new-password"
                  placeholder="Email"
                  className={styles.input}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  name="windia_signup_phone"
                  autoComplete="off"
                  placeholder="Phone number"
                  className={styles.input}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
                <input
                  type="password"
                  name="windia_signup_password"
                  autoComplete="new-password"
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
            </>
          ) : (
            <>
              <h1 className={styles.title}>Verify your email</h1>
              <p className={styles.subtitle}>Step 2 of 2 - enter the code</p>
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
                    />
                  ))}
                </div>

                <p className={styles.resendRow}>
                  Didn&apos;t get it?{' '}
                  <button type="button" className={styles.resendLink} onClick={handleResend}>
                    Resend OTP
                  </button>
                </p>

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.submitBtn} disabled={loading}>
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
