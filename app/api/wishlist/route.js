import { supabase } from "@/src/frontend/lib/supabase";
import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { getAuthedUser, errorResponse, successResponse, sanitizeObject } from "@/src/frontend/lib/security";

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return successResponse({ wishlist: [] });

  const { data, error } = await supabaseAdmin
    .from("wishlists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return successResponse({ wishlist: [] });
  return successResponse({ wishlist: (data || []).map((row) => row.product_snapshot || row) });
}

export async function POST(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in to sync wishlist", 401);

  const body = sanitizeObject(await req.json().catch(() => ({})), 1200);
  const product = body.product;
  const productId = product?.id || product?._id || body.productId;
  if (!productId) return errorResponse("Product is required", 400);

  const { error } = await supabaseAdmin.from("wishlists").upsert({
    user_id: user.id,
    product_id: productId,
    product_snapshot: product || { id: productId },
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,product_id" });

  if (error) return errorResponse("Could not save wishlist item", 500);
  return successResponse({ productId });
}

export async function DELETE(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return errorResponse("Product is required", 400);

  await supabaseAdmin.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
  return successResponse({ productId });
}
