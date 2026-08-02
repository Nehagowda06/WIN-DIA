import { supabaseAdmin } from "@/src/frontend/lib/supabase-admin";
import { successResponse } from "@/src/frontend/lib/security";
import { localProducts, normalizeProduct } from "@/src/frontend/data/products";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  try {
    let query = supabaseAdmin
      .from("products")
      .select("*")
      .neq("is_active", false)
      .order("created_at", { ascending: false });

    if (q) query = query.ilike("name", `%${q}%`);

    const { data, error } = await query;
    if (!error && data?.length) {
      return successResponse({ products: data.map(normalizeProduct) });
    }
  } catch {}

  const products = q
    ? localProducts.filter((product) => product.name.toLowerCase().includes(q.toLowerCase()))
    : localProducts;

  return successResponse({ products });
}
