import { Hero } from "@/src/frontend/components/shop/Hero";
import { Everyday } from "@/src/frontend/components/shop/products/Everyday";
import { GlutenFree } from "@/src/frontend/components/shop/products/GlutenFree";

/**
 * Fetches products for a given category slug from the internal API.
 * Returns an empty array on failure (components will fall back to static data).
 */
async function fetchProductsByCategory(categorySlug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/products?category=${categorySlug}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return [];

    const data = await res.json();

    // Handle both paginated { items: [...] } and direct array responses
    const products = data?.data?.items ?? data?.data ?? data?.products ?? [];
    if (!Array.isArray(products) || products.length === 0) return [];

    // Map Supabase product shape to the frontend Product shape expected by ProductRange
    return products.map((p: Record<string, unknown>) => ({
      id: String(p.slug ?? p.id ?? ""),
      title: "Fiber Rich Thins",
      name: `${String(p.flavor ?? "")} Flavour`,
      flavour: String(p.flavor ?? ""),
      image: String(p.image ?? p.image_url ?? ""),
      description: String(p.description ?? ""),
      price: `₹${Number(p.price ?? 0)}`,
      offer: "12-Packet Bundle",
      offerDetails: "🎁 Pay for 10 + Get 2 FREE",
      delivery: "🚚 Free Delivery",
    }));
  } catch {
    return [];
  }
}

export default async function ShopPage() {
  const [glutenFreeProducts, traditionalProducts] = await Promise.all([
    fetchProductsByCategory("gluten-free"),
    fetchProductsByCategory("traditional"),
  ]);

  return (
    <main>
      <Hero />
      <GlutenFree products={glutenFreeProducts.length ? glutenFreeProducts : undefined} />
      <Everyday products={traditionalProducts.length ? traditionalProducts : undefined} />
    </main>
  );
}
