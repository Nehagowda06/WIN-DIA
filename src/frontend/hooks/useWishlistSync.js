"use client";
import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setWishlist } from "@/src/frontend/redux/slices/wishlistSlice";
import { useAuth } from "./useAuth";
import { resolveAndAddToWishlist, enrichWishlistItems } from "./wishlistSyncHelpers";

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
