import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { errorResponse, successResponse, sanitizeObject } from "@/src/frontend/lib/security";
import { requireAdmin } from "../_helpers";

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { data, error: dbErr } = await supabaseAdmin
    .from("page_content")
    .select("*")
    .order("section")
    .order("label");

  if (dbErr) return errorResponse(dbErr.message || "Could not load content", 500);
  return successResponse({ content: data || [] });
}

export async function PUT(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = sanitizeObject(await req.json().catch(() => ({})), 5000);
  const key = String(body.key || "").trim();
  if (!/^[a-z0-9_.-]+$/.test(key)) return errorResponse("Key must use lowercase letters, numbers, dots, dashes, or underscores", 400);

  const { data, error: dbErr } = await supabaseAdmin
    .from("page_content")
    .upsert({
      key,
      value: String(body.value ?? ""),
      section: body.section || "Custom",
      label: body.label || key,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbErr) return errorResponse(dbErr.message || "Could not save content", 500);
  return successResponse({ content: data });
}

export async function DELETE(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const key = new URL(req.url).searchParams.get("key");
  if (!key) return errorResponse("Key is required", 400);

  const { error: dbErr } = await supabaseAdmin.from("page_content").delete().eq("key", key);
  if (dbErr) return errorResponse(dbErr.message || "Could not delete content", 500);
  return successResponse({ deleted: true });
}
