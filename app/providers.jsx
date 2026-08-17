"use client";
import { useEffect, useRef } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "@/src/frontend/redux/store";
import { setCart } from "@/src/frontend/redux/slices/cartSlice";
import { setWishlist } from "@/src/frontend/redux/slices/wishlistSlice";
import { AuthProvider, useAuth } from "@/src/frontend/hooks/useAuth";
import { Toaster } from "react-hot-toast";

function Persistence() {
  const dispatch = useDispatch();
  const { user, loading } = useAuth();
  const hydrated = useRef(false);
  const cartItems = useSelector((s) => s.cart.cartItems);
  const wishlistItems = useSelector((s) => s.wishlist.wishlistItems);
  const prevUserId = useRef(null);

  // Hydrate from localStorage only when user is confirmed logged in
  useEffect(() => {
    if (loading) return; // Wait for auth to resolve

    if (user) {
      // User is logged in — load their data from localStorage (keyed by user ID)
      try {
        const cartKey = `cartItems_${user.id}`;
        const wishKey = `wishlistItems_${user.id}`;
        dispatch(setCart(JSON.parse(localStorage.getItem(cartKey) || "[]")));
        dispatch(setWishlist(JSON.parse(localStorage.getItem(wishKey) || "[]")));
      } catch {
        dispatch(setCart([]));
        dispatch(setWishlist([]));
      }
      prevUserId.current = user.id;
    } else {
      // Not logged in — clear Redux state so nothing from a previous user shows
      dispatch(setCart([]));
      dispatch(setWishlist([]));
      prevUserId.current = null;
    }
    hydrated.current = true;
  }, [user, loading, dispatch]);

  // Persist cart to localStorage (keyed by user ID)
  useEffect(() => {
    if (hydrated.current && prevUserId.current) {
      localStorage.setItem(`cartItems_${prevUserId.current}`, JSON.stringify(cartItems));
    }
  }, [cartItems]);

  // Persist wishlist to localStorage (keyed by user ID)
  useEffect(() => {
    if (hydrated.current && prevUserId.current) {
      localStorage.setItem(`wishlistItems_${prevUserId.current}`, JSON.stringify(wishlistItems));
    }
  }, [wishlistItems]);

  return null;
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Persistence />
        <Toaster position="top-center" toastOptions={{ duration: 2600 }} />
        {children}
      </AuthProvider>
    </Provider>
  );
}
