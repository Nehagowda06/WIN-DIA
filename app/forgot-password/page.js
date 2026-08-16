"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './forgot-password.module.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const result = await res.json();
      setError(result.error || 'Something went wrong. Please try again.');
      return;
    }

    setSent(true);

    /* === Move to reset-password page, carrying the email along === */
    setTimeout(() => {
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    }, 1200);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Forgot password?</h1>
        <p className={styles.subtitle}>Enter your email and we'll send you a reset code</p>

        {sent ? (
          <p className={styles.success}>Code sent — redirecting you...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Sending...' : 'SEND RESET CODE'}
            </button>
          </form>
        )}

        <p className={styles.footer}>
          Remembered it? <a href="/login" className={styles.linkAccent}>Back to login</a>
        </p>
      </div>
    </div>
  );
}