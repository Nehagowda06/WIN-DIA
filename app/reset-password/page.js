"use client";

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './reset-password.module.css';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleResend = async () => {
    setError('');
    await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'reset_password' }),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp_code: otpDigits.join(''),
        new_password: newPassword,
      }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error);
      return;
    }

    router.push('/login');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Reset password</h1>
        <p className={styles.subtitle}>Enter the code sent to {email}</p>

        <form onSubmit={handleSubmit}>
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
            Didn't get it?{' '}
            <button type="button" className={styles.resendLink} onClick={handleResend}>
              Resend OTP
            </button>
          </p>

          <input
            type="password"
            placeholder="New password"
            className={styles.input}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Resetting...' : 'RESET PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}