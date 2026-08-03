import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env.config';

let browserClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/**
 * Creates or gets singleton Supabase browser client (Anon key)
 */
export function getBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }
  const env = getEnv();
  browserClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return browserClient;
}

/**
 * Creates request-scoped server Supabase client instance using request authorization header
 */
export function getServerClient(authHeader?: string): SupabaseClient {
  const env = getEnv();
  const globalHeaders: Record<string, string> = {};

  if (authHeader) {
    globalHeaders.Authorization = authHeader;
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: {
      headers: globalHeaders,
    },
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Creates or gets elevated Admin Supabase client using Service Role Key
 * Use ONLY for explicit admin or system tasks requiring RLS bypass (webhooks, migrations, admin tasks).
 */
export function getAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }
  const env = getEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to initialize Admin client');
  }

  adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}
