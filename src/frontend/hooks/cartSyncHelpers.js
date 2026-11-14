import { BundlePricing } from "@/src/frontend/lib/pricing";

const COMBO_NAME = /combo|assorted/i;

/**
 * Enriches raw cart items (product_id + quantity) with product details
 * by fetching from the products API.
 */
export async function enrichCartItems(items) {
  try {
    const productIds = items.map((i) => i.product_id);
    const res = await fetch(`/api/products?ids=${productIds.join(",")}`);
    const data = await res.json();
    const products = data?.data?.items ?? data?.data ?? data?.products ?? [];

    const productMap = new Map();
    if (Array.isArray(products)) {
      for (const p of products) {
        productMap.set(p.id, p);
      }
    }

    return items.map((item) => {
      const product = productMap.get(item.product_id);

      // Parse net_weight from product catalog
      let netWeight = BundlePricing.BUNDLE_WEIGHT_GRAMS; // 1 bundle = 6 × 40g = 240g
      if (product?.net_weight) {
        if (typeof product.net_weight === "string") {
          const parsed = parseInt(product.net_weight.replace(/[^0-9]/g, ""), 10);
          if (!isNaN(parsed) && parsed > 0) {
            netWeight = parsed;
          }
        } else if (typeof product.net_weight === "number" && product.net_weight > 0) {
          netWeight = product.net_weight;
        }
      }

      const name = product?.name
        || (product?.flavor ? `${product.flavor} Flavour` : "WIN-DIA Product");

      return {
        id: item.product_id,
        _id: item.product_id,
        name,
        price: product?.price ?? BundlePricing.BUNDLE_PRICE,
        image: product?.image || product?.image_url || "/images/product-methi.jpg",
        flavor: product?.flavor || null,
        qty: item.quantity || 1,
        // count_in_stock is in packets; 0 is a real value (out of stock)
        countInStock: product?.count_in_stock ?? undefined,
        netWeight,
        isComboProduct: COMBO_NAME.test(product?.name || ""),
      };
    });
  } catch {
    // Fallback: return items with minimal data
    return items.map((item) => ({
      id: item.product_id,
      _id: item.product_id,
      name: "WIN-DIA Product",
      price: BundlePricing.BUNDLE_PRICE,
      image: "/images/product-methi.jpg",
      qty: item.quantity || 1,
      netWeight: BundlePricing.BUNDLE_WEIGHT_GRAMS,
      isComboProduct: false,
    }));
  }
}
