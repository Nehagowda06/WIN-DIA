"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/src/frontend/lib/supabase/client';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Finishing Google sign in...');

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const params = new URLSearchParams(window.location.search);
      const providerError = params.get('error_description') || params.get('error');
      const next = params.get('next') || '/';

      if (providerError) {
        window.location.replace(`/login?error=auth_failed&message=${encodeURIComponent(providerError)}`);
        return;
      }

      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          window.location.replace(`/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        window.location.replace('/login?error=auth_failed&message=Google sign in did not create a session.');
        return;
      }

      if (!cancelled) {
        setMessage('Signed in. Taking you home...');
        window.location.replace(next);
      }
    }

    finishAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#FDF6EC',
      color: '#3B1F0F',
      fontFamily: 'serif',
      padding: 24,
      textAlign: 'center',
    }}>
      <div>
        <h1 style={{ marginBottom: 12 }}>WINDIA</h1>
        <p>{message}</p>
      </div>
    </main>
  );
}
