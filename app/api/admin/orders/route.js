import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { errorResponse, successResponse, sanitizeObject } from "@/src/frontend/lib/security";
import { requireAdmin } from "../_helpers";

const STATUSES = ["placed", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const status = new URL(req.url).searchParams.get("status");
  let query = supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("order_status", status);

  const { data, error: dbErr } = await query;
  if (dbErr) return errorResponse(dbErr.message || "Could not load orders", 500);
  return successResponse({ orders: data || [] });
}

export async function PATCH(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = sanitizeObject(await req.json().catch(() => ({})), 300);
  if (!body.id) return errorResponse("Order id is required", 400);
  if (!STATUSES.includes(body.order_status)) return errorResponse("Invalid order status", 400);

  const { data, error: dbErr } = await supabaseAdmin
    .from("orders")
    .update({ order_status: body.order_status, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select()
    .single();

  if (dbErr) return errorResponse(dbErr.message || "Could not update order", 500);
  return successResponse({ order: data });
}
