import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { errorResponse, successResponse, sanitizeObject } from "@/src/frontend/lib/security";
import { requireAdmin } from "../_helpers";

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { data, error: dbErr } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbErr) return errorResponse(dbErr.message || "Could not load coupons", 500);
  return successResponse({ coupons: data || [] });
}

export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = sanitizeObject(await req.json().catch(() => ({})), 300);
  const code = String(body.code || "").trim().toUpperCase();
  const discountPercent = Number(body.discountPercent || body.discount_percent);

  if (code.length < 3) return errorResponse("Enter a valid coupon code", 400);
  if (!discountPercent || discountPercent <= 0 || discountPercent > 100) {
    return errorResponse("Discount must be between 1 and 100 percent", 400);
  }

  const { data, error: dbErr } = await supabaseAdmin
    .from("coupons")
    .insert({
      code,
      discount_percent: discountPercent,
      min_order_value: Number(body.minOrderValue || body.min_order_value || 0),
      usage_limit: body.usageLimit || body.usage_limit ? Number(body.usageLimit || body.usage_limit) : null,
      expires_at: body.expiresAt || body.expires_at || null,
      active: true,
    })
    .select()
    .single();

  if (dbErr) return errorResponse(dbErr.message || "Could not create coupon", 500);
  return successResponse({ coupon: data }, 201);
}

export async function PATCH(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = sanitizeObject(await req.json().catch(() => ({})), 300);
  if (!body.id) return errorResponse("Coupon id is required", 400);

  const { data, error: dbErr } = await supabaseAdmin
    .from("coupons")
    .update({ active: Boolean(body.active) })
    .eq("id", body.id)
    .select()
    .single();

  if (dbErr) return errorResponse(dbErr.message || "Could not update coupon", 500);
  return successResponse({ coupon: data });
}
