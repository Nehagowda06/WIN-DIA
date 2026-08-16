"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, setRememberMe } from '@/lib/supabase/client';
import styles from './login.module.css';

const TAGLINES = [
  'Naturally Fibre-Rich',
  'Rooted in Purity',
  'Crafted for Wellness',
  'Nourish, Naturally',
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  /* === Email/password login === */
  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  setRememberMe(remember);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await res.json();

    if (!res.ok) {
      if (result.accountNotFound) {
        router.push(`/register?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(result.error || 'Invalid email or password.');
      return;
    }

    await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });

    router.push('/');
  } catch (err) {
    console.error('Login error:', err);
    setError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
};

  /* === Google OAuth login === */
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* === Left panel: animated brand showcase === */}
        <div className={styles.brandPanel}>
          <div className={styles.brandPattern} aria-hidden="true">
            <span className={styles.leaf}></span>
            <span className={styles.leaf}></span>
            <span className={styles.leaf}></span>
            <span className={styles.leaf}></span>
            <span className={styles.leaf}></span>
          </div>

          <div className={styles.brandContent}>
            <p className={styles.brandLogo}>
              {'WINDIA'.split('').map((letter, i) => (
                <span
                  key={i}
                  className={styles.brandLetter}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {letter}
                </span>
              ))}
            </p>
            <div className={styles.taglineWrap}>
              <p key={taglineIndex} className={styles.brandTagline}>
                {TAGLINES[taglineIndex]}
              </p>
              <span key={`underline-${taglineIndex}`} className={styles.taglineUnderline}></span>
            </div>
          </div>
        </div>

        {/* === Right panel: form === */}
        <div className={styles.formPanel}>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to continue your WINDIA journey</p>

          <button type="button" className={styles.googleBtn} onClick={handleGoogleLogin}>
            <img src="/icons/google.svg" alt="" className={styles.googleIcon} />
            Continue with Google
          </button>

          <div className={styles.divider}><span>or</span></div>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />

            <div className={styles.formRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <a href="/forgot-password" className={styles.linkSubtle}>Forgot password?</a>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <p className={styles.footer}>
            New here? <a href="/register" className={styles.linkAccent}>Create an account</a>
          </p>
        </div>
      </div>
    </div>
  );
}