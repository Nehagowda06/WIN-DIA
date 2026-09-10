import { createClient } from '@supabase/supabase-js';

/* === Server-only admin client — uses the service role key === */
/* NEVER import this in a "use client" file or expose SUPABASE_SERVICE_ROLE_KEY to the browser */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}