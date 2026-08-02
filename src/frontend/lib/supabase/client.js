"use client";

import { createBrowserClient } from '@supabase/ssr';

const REMEMBER_FLAG = 'windia-remember-me';

export function setRememberMe(remember) {
  localStorage.setItem(REMEMBER_FLAG, remember ? 'true' : 'false');
}

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
