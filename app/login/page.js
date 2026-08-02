"use client";

import { useState, useEffect } from 'react';
import { supabase, setRememberMe } from '@/src/frontend/lib/supabase/client';
import styles from './login.module.css';

const TAGLINES = [
  'Naturally Fibre-Rich',
  'Rooted in Purity',
  'Crafted for Wellness',
  'Nourish, Naturally',
];

const EMPTY_LOGIN = { email: '', password: '' };

export default function LoginPage() {
  const [email, setEmail] = useState(EMPTY_LOGIN.email);
  const [password, setPassword] = useState(EMPTY_LOGIN.password);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'auth_failed') {
      const message = params.get('message');
      if (message?.startsWith('Unable to exchange external code')) {
        setError('Google sign in is reaching Supabase, but Supabase cannot exchange the Google code. Check the Google OAuth Client ID/Secret and callback URL in Supabase.');
        return;
      }

      setError(message || 'Google sign in could not be completed. Please try again.');
    }
  }, []);

  useEffect(() => {
    const timers = [100, 600].map((delay) =>
      window.setTimeout(() => {
        setEmail(EMPTY_LOGIN.email);
        setPassword(EMPTY_LOGIN.password);
      }, delay)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  /* === Email/password login === */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setRememberMe(remember);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message || 'Invalid email or password.');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Login succeeded, but session was not created. Please try again.');
        return;
      }

      window.location.href = '/';
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* === Google OAuth login === */
  const handleGoogleLogin = async () => {
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });

    if (oauthError) {
      setError(oauthError.message || 'Could not start Google sign in.');
    }
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

          <form onSubmit={handleSubmit} autoComplete="off">
            <input
              type="email"
              name="windia_login_email"
              autoComplete="off"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
              autoFocus
            />
            <input
              type="password"
              name="windia_login_password"
              autoComplete="new-password"
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
