// Ported from windia-integrated-version3-main/src/lib/supabase.js
// Change: removed NEXT_PUBLIC_ prefix handling — works the same in plain Node

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,   // server-side — no session persistence needed
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
