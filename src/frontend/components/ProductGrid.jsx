"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FiHeart, FiShoppingCart } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/src/frontend/redux/slices/cartSlice";
import { addToWishlist, removeFromWishlist } from "@/src/frontend/redux/slices/wishlistSlice";
import { setProducts } from "@/src/frontend/redux/slices/productsSlice";
import { localProducts } from "@/src/frontend/data/products";
import styles from "@/app/storefront.module.css";

export default function ProductGrid({ initialProducts = localProducts }) {
  const dispatch = useDispatch();
  const productsFromStore = useSelector((s) => s.products.products);
  const wishlistItems = useSelector((s) => s.wishlist.wishlistItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (alive) dispatch(setProducts(data.products?.length ? data.products : initialProducts));
      })
      .catch(() => dispatch(setProducts(initialProducts)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [dispatch, initialProducts]);

  const products = productsFromStore.length ? productsFromStore : initialProducts;
  const wishIds = useMemo(() => new Set(wishlistItems.map((item) => item.id || item._id)), [wishlistItems]);

  const addCart = (product) => {
    dispatch(addToCart(product, 1));
    toast.success("Added to cart");
  };

  const toggleWish = (product) => {
    const id = product.id || product._id;
    if (wishIds.has(id)) {
      dispatch(removeFromWishlist(id));
      toast("Removed from wishlist");
    } else {
      dispatch(addToWishlist(product));
      toast.success("Saved to wishlist");
    }
  };

  return (
    <>
      {loading && <p className={styles.muted}>Loading products...</p>}
      <div className={styles.grid}>
        {products.map((product) => {
          const id = product.id || product._id;
          return (
            <article className={styles.card} key={id}>
              <Link href={`/shop?product=${product.slug || id}`} className={styles.cardImg}>
                <img src={product.image || "/images/product-methi.jpg"} alt={product.name} />
              </Link>
              <div className={styles.cardBody}>
                <h3>{product.name}</h3>
                <p className={styles.muted}>{product.description || product.category}</p>
                <div className={styles.priceRow}>
                  <span className={styles.price}>Rs. {product.price}</span>
                  {product.originalPrice && <span className={styles.strike}>Rs. {product.originalPrice}</span>}
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.brownBtn} onClick={() => addCart(product)}>
                    <FiShoppingCart /> Add
                  </button>
                  <button className={styles.iconBtn} onClick={() => toggleWish(product)} aria-label="Toggle wishlist">
                    <FiHeart fill={wishIds.has(id) ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
