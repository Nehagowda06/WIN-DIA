"use client";
import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setWishlist } from "@/src/frontend/redux/slices/wishlistSlice";
import { useAuth } from "./useAuth";

/**
 * Syncs the frontend Redux wishlist with the backend Supabase wishlist.
 * 
 * On login: Fetches wishlist from backend API, overrides local state.
 * On wishlist change: Pushes add/remove to backend in background.
 * 
 * The backend wishlist stores only product_id (UUID). Product details
 * are fetched from /api/products when hydrating.
 */
export function useWishlistSync() {
  const dispatch = useDispatch();
  const { user, token, loading } = useAuth();
  const wishlistItems = useSelector((s) => s.wishlist.wishlistItems);
  const syncedRef = useRef(false);
  const prevWishlistRef = useRef([]);

  const authFetch = useCallback((url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  }, [token]);

  // Fetch wishlist from backend when user logs in
  useEffect(() => {
    if (loading || !user || !token) {
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;

    async function fetchBackendWishlist() {
      try {
        const res = await authFetch("/api/wishlist");
        const data = await res.json();

        if (!data.success || !data.wishlist) {
          syncedRef.current = true;
          return;
        }

        const backendWishlist = data.wishlist || [];

        if (backendWishlist.length === 0) {
          // Backend wishlist is empty — push local items if any
          if (wishlistItems.length > 0) {
            for (const item of wishlistItems) {
              const productId = item.dbId || item.productId || item.product_id || item._id || item.id;
              await authFetch("/api/wishlist", {
                method: "POST",
                body: JSON.stringify({ productId }),
              }).catch(() => {});
            }
          }
          syncedRef.current = true;
          prevWishlistRef.current = wishlistItems;
          return;
        }

        // Backend has items — enrich with product details
        const enrichedItems = await enrichWishlistItems(backendWishlist);
        
        dispatch(setWishlist(enrichedItems));
        prevWishlistRef.current = enrichedItems;
        syncedRef.current = true;
      } catch (err) {
        console.warn("[useWishlistSync] Failed to sync wishlist from backend:", err);
        syncedRef.current = true;
      }
    }

    fetchBackendWishlist();
  }, [user, token, loading, authFetch, dispatch]);

  // Push wishlist changes to backend when items change
  useEffect(() => {
    if (!syncedRef.current || !token) return;

    const prev = prevWishlistRef.current;
    const current = wishlistItems;

    // Extract database UUIDs only (skip items without valid dbId)
    const getDbId = (item) => item.dbId || item.productId || item.product_id;
    
    const prevDbIds = new Set(prev.map(getDbId).filter(Boolean));
    const currDbIds = new Set(current.map(getDbId).filter(Boolean));

    // Added items
    for (const item of current) {
      const dbId = getDbId(item);
      if (!dbId) {
        // If no dbId, try to resolve it from the products API by flavor/name
        resolveAndAddToWishlist(item, authFetch);
        continue;
      }
      if (!prevDbIds.has(dbId)) {
        authFetch("/api/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId: dbId }),
        }).catch(() => {});
      }
    }

    // Removed items
    for (const item of prev) {
      const dbId = getDbId(item);
      if (!dbId) continue; // Skip if no database UUID available
      if (!currDbIds.has(dbId)) {
        authFetch(`/api/wishlist?productId=${dbId}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    }

    prevWishlistRef.current = current;
  }, [wishlistItems, token, authFetch]);
}

/**
 * Resolves a static product to its database UUID and adds it to the wishlist.
 * This handles the case where static products (without dbId) are added to wishlist.
 */
async function resolveAndAddToWishlist(item, authFetch) {
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
async function enrichWishlistItems(items) {
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
