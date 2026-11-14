/**
 * Resolves a static product to its database UUID and adds it to the wishlist.
 * This handles the case where static products (without dbId) are added to wishlist.
 */
export async function resolveAndAddToWishlist(item, authFetch) {
  try {
    // Fetch all products from API to get database UUIDs
    const res = await fetch("/api/products");
    const data = await res.json();
    const products = data?.data?.items ?? data?.data ?? data?.products ?? [];
    
    if (!Array.isArray(products) || products.length === 0) {
      console.warn("[useWishlistSync] Cannot resolve dbId - products API returned no items");
      return;
    }

    // Match by flavor (case-insensitive)
    const itemFlavor = String(item.flavor || item.flavour || "").toLowerCase().trim();
    const matchedProduct = products.find((p) => {
      const pFlavor = String(p.flavor || "").toLowerCase().trim();
      return pFlavor === itemFlavor || 
             pFlavor.includes(itemFlavor) || 
             itemFlavor.includes(pFlavor);
    });

    if (!matchedProduct || !matchedProduct.id) {
      console.warn("[useWishlistSync] No database match found for flavor:", itemFlavor);
      return;
    }

    // Add to backend wishlist using the resolved UUID
    await authFetch("/api/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId: matchedProduct.id }),
    });
    
    console.log(`[useWishlistSync] Resolved and added ${itemFlavor} → ${matchedProduct.id}`);
  } catch (err) {
    console.warn("[useWishlistSync] Failed to resolve and add product:", err);
  }
}

/**
 * Enriches raw wishlist items (product_id only) with product details
 * by fetching from the products API.
 */
export async function enrichWishlistItems(items) {
  try {
    const productIds = items.map((i) => i.product_id || i.productId).filter(Boolean);
    if (productIds.length === 0) return [];

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
      const productId = item.product_id || item.productId;
      const product = productMap.get(productId);
      
      if (!product) {
        // Fallback if product not found
        return {
          id: productId,
          _id: productId,
          dbId: productId,
          productId: productId,
          product_id: productId,
          name: "WIN-DIA Product",
          price: 640,
          image: "/images/product-methi.jpg",
        };
      }

      // Map flavor to frontend product ID for UI compatibility
      const flavor = String(product.flavor ?? "").toLowerCase();
      let frontendId = "";
      
      if (flavor === "jeera" || flavor.includes("jeera") || flavor.includes("cumin")) {
        frontendId = "jeera";
      } else if (flavor === "garlic" || flavor.includes("garlic")) {
        frontendId = "garlic";
      } else if (flavor === "onion" || flavor.includes("onion")) {
        frontendId = "onion";
      } else if (flavor.includes("curry") || flavor.includes("leaf")) {
        frontendId = "curry-leaf";
      } else if (flavor.includes("combo") || flavor.includes("assorted")) {
        frontendId = "combo-offer";
      } else {
        frontendId = flavor || String(product.slug ?? "").toLowerCase();
      }

      return {
        id: frontendId,
        _id: frontendId,
        dbId: productId, // Store the real database UUID
        productId: productId,
        product_id: productId,
        name: product.name || `${product.flavor} Flavour`,
        price: Number(product.price || 640),
        image: product.image || product.image_url || "/images/product-methi.jpg",
        flavor: product.flavor || null,
      };
    });
  } catch {
    // Fallback: return items with minimal data
    return items.map((item) => {
      const productId = item.product_id || item.productId;
      return {
        id: productId,
        _id: productId,
        dbId: productId,
        productId: productId,
        product_id: productId,
        name: "WIN-DIA Product",
        price: 640,
        image: "/images/product-methi.jpg",
      };
    });
  }
}
