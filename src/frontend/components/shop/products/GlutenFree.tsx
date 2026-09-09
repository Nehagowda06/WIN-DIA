"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

import { glutenFreeProducts } from "@/src/frontend/data/products";
import { addToCart } from "@/src/frontend/redux/slices/cartSlice";
import { addToWishlist, removeFromWishlist } from "@/src/frontend/redux/slices/wishlistSlice";
import { supabase } from "@/src/frontend/lib/supabase/client";

import { ProductCard } from "./ProductCard";
import { toStoreProduct, type Product, type ProductTheme } from "./productShared";

import styles from "./GlutenFree.module.scss";

type ProductRangeProps = {
  readonly heading: string;
  readonly headingId: string;
  readonly products: readonly Product[];
  readonly theme: ProductTheme;
};

/**
 * Same public shape as before: ProductRange is shared by GlutenFree,
 * Everyday, and ComboOffer, each rendering their own <section> one after
 * another wherever your page already places them. No shared nav or filter
 * bar lives in here — that stays out of this component on purpose, so each
 * range keeps working as a standalone drop-in.
 *
 * Clicking a card now takes you to a full /product/[id] page (see
 * ProductDetail.tsx) instead of opening a modal.
 *
 * Adding to cart/wishlist requires a logged-in Supabase session — if
 * there's no user, the click redirects to /login instead of dispatching.
 */
export function ProductRange({ heading, headingId, products, theme }: ProductRangeProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map((p) => [p.id, 0]))
  );
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});

  const requireAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/shop");
      return false;
    }
    return true;
  };

  const setQuantity = async (product: Product, next: number) => {
    const nextQuantity = Math.max(0, next);
    const current = quantities[product.id] ?? 0;
    if (nextQuantity > current) {
      if (!(await requireAuth())) return;
      dispatch(addToCart(toStoreProduct(product, theme), nextQuantity - current));
      toast.success("Added to cart");
    }
    setQuantities((q) => ({ ...q, [product.id]: nextQuantity }));
  };

  const toggleWishlist = async (product: Product) => {
    const next = !wishlisted[product.id];
    if (next && !(await requireAuth())) return;
    const storeProduct = toStoreProduct(product, theme);
    if (next) {
      dispatch(addToWishlist(storeProduct));
      toast.success("Saved to wishlist");
    } else {
      dispatch(removeFromWishlist(storeProduct.id));
      toast("Removed from wishlist");
    }
    setWishlisted((w) => ({ ...w, [product.id]: next }));
  };

  return (
    <section className={styles.section} aria-labelledby={headingId} data-navbar-theme={theme}>
      <div className={styles.headingArea}>
        <h2 id={headingId} className={styles.heading}>{heading}</h2>
      </div>

      <ul className={styles.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            theme={theme}
            quantity={quantities[product.id] ?? 0}
            isWishlisted={!!wishlisted[product.id]}
            onQuantityChange={(q) => setQuantity(product, q)}
            onToggleWishlist={() => toggleWishlist(product)}
          />
        ))}
      </ul>
    </section>
  );
}

type GlutenFreeProps = {
  readonly products?: readonly Product[];
};

/** Gluten-free product range — accepts an optional products override, falls back to the default list. */
export function GlutenFree({ products }: GlutenFreeProps) {
  return (
    <ProductRange
      heading="Gut Health Range"
      headingId="gluten-free-heading"
      products={products ?? glutenFreeProducts}
      theme="gluten-free"
    />
  );
}