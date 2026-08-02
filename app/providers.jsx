"use client";
import { useEffect, useRef } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "@/src/frontend/redux/store";
import { setCart } from "@/src/frontend/redux/slices/cartSlice";
import { setWishlist } from "@/src/frontend/redux/slices/wishlistSlice";
import { AuthProvider } from "@/src/frontend/hooks/useAuth";
import { Toaster } from "react-hot-toast";

function Persistence() {
  const dispatch = useDispatch();
  const hydrated = useRef(false);
  const cartItems = useSelector((s) => s.cart.cartItems);
  const wishlistItems = useSelector((s) => s.wishlist.wishlistItems);

  useEffect(() => {
    try {
      dispatch(setCart(JSON.parse(localStorage.getItem("cartItems") || "[]")));
      dispatch(setWishlist(JSON.parse(localStorage.getItem("wishlistItems") || "[]")));
    } catch { dispatch(setCart([])); dispatch(setWishlist([])); }
    finally { hydrated.current = true; }
  }, [dispatch]);

  useEffect(() => {
    if (hydrated.current) localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (hydrated.current) localStorage.setItem("wishlistItems", JSON.stringify(wishlistItems));
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

