import { createClient } from "@supabase/supabase-js";

// Lazy singleton — created on first use, not at module load time.
// This ensures env vars are set before the client initializes.
let _client = null;

export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    if (!_client) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error("Supabase env vars not set");
      _client = createClient(url, key);
    }
    return _client[prop];
  }
});
