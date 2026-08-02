import { supabase } from "@/src/frontend/lib/supabase";
import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse } from "@/src/frontend/lib/security";

export async function requireAdmin(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return { error: errorResponse("Please sign in", 401) };
  if (!(await isAdmin(user.id, supabaseAdmin))) {
    return { error: errorResponse("Admin access required", 403) };
  }
  return { user };
}
