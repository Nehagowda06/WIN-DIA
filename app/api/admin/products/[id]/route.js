import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { errorResponse, successResponse, sanitizeObject } from "@/src/frontend/lib/security";
import { requireAdmin } from "../../_helpers";

const allowedFields = [
  "name", "description", "price", "original_price", "image", "image_url",
  "category_id", "flavor", "count_in_stock", "net_weight", "sku",
  "is_low_gi", "is_gluten_free", "is_vegan", "is_bestseller", "is_active",
];

export async function PATCH(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await params;
  const body = sanitizeObject(await req.json().catch(() => ({})), 3000);
  const update = { updated_at: new Date().toISOString() };

  for (const key of allowedFields) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  if (update.price !== undefined) update.price = Number(update.price);
  if (update.original_price !== undefined && update.original_price !== null) update.original_price = Number(update.original_price);
  if (update.count_in_stock !== undefined) update.count_in_stock = Number(update.count_in_stock);
  if (update.net_weight !== undefined && update.net_weight !== null) update.net_weight = Number(update.net_weight);

  const { data, error: dbErr } = await supabaseAdmin
    .from("products")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (dbErr) return errorResponse(dbErr.message || "Could not update product", 500);
  return successResponse({ product: data });
}

export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await params;
  const { error: dbErr } = await supabaseAdmin
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (dbErr) return errorResponse(dbErr.message || "Could not deactivate product", 500);
  return successResponse({ deactivated: true });
}
