import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { errorResponse, successResponse, sanitizeObject } from "@/src/frontend/lib/security";
import { requireAdmin } from "../_helpers";

function productPayload(body) {
  const name = String(body.name || "").trim();
  return {
    id: body.id || randomUUID(),
    name,
    description: body.description || body.short_description || null,
    price: Number(body.price),
    original_price: body.original_price ? Number(body.original_price) : null,
    image: body.image || body.image_url || null,
    image_url: body.image_url || body.image || null,
    category_id: body.category_id || null,
    flavor: body.flavor || null,
    count_in_stock: Number(body.count_in_stock ?? body.countInStock ?? 0),
    net_weight: body.net_weight ? Number(body.net_weight) : null,
    sku: body.sku || null,
    is_low_gi: Boolean(body.is_low_gi),
    is_gluten_free: Boolean(body.is_gluten_free),
    is_vegan: Boolean(body.is_vegan),
    is_bestseller: Boolean(body.is_bestseller),
    is_active: body.is_active !== false,
  };
}

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { data, error: dbErr } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbErr) return errorResponse(dbErr.message || "Could not load products", 500);
  return successResponse({ products: data || [] });
}

export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = sanitizeObject(await req.json().catch(() => ({})), 3000);
  if (!body.name || String(body.name).trim().length < 2) return errorResponse("Product name is required", 400);
  if (!body.price || Number(body.price) <= 0) return errorResponse("Enter a valid price", 400);

  const { data, error: dbErr } = await supabaseAdmin
    .from("products")
    .insert(productPayload(body))
    .select()
    .single();

  if (dbErr) return errorResponse(dbErr.message || "Could not create product", 500);
  return successResponse({ product: data }, 201);
}
