import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { errorResponse, successResponse, sanitizeObject } from "@/src/frontend/lib/security";
import { requireAdmin } from "../_helpers";

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { data, error: dbErr } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at, updated_at, avatar_url")
    .order("created_at", { ascending: false })
    .limit(500);

  if (dbErr) return errorResponse(dbErr.message || "Could not load users", 500);
  return successResponse({ users: data || [] });
}

export async function PATCH(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = sanitizeObject(await req.json().catch(() => ({})), 300);
  if (!body.id) return errorResponse("User id is required", 400);
  if (!["admin", "customer"].includes(body.role)) return errorResponse("Invalid role", 400);

  const { data, error: dbErr } = await supabaseAdmin
    .from("profiles")
    .update({ role: body.role, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select("id, full_name, email, phone, role, created_at, updated_at, avatar_url")
    .single();

  if (dbErr) return errorResponse(dbErr.message || "Could not update user role", 500);
  return successResponse({ user: data });
}
