"use client";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { FiShoppingCart, FiTrash2 } from "react-icons/fi";
import { addToCart } from "@/src/frontend/redux/slices/cartSlice";
import { removeFromWishlist } from "@/src/frontend/redux/slices/wishlistSlice";
import styles from "../storefront.module.css";

export default function WishlistPage() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.wishlist.wishlistItems);

  return (
    <main className={styles.shell}>
      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <div>
            <h2>Wishlist</h2>
            <p className={styles.muted}>Saved products stay in this browser and can be moved to cart anytime.</p>
          </div>
          <Link href="/shop" className={styles.ghost}>Shop more</Link>
        </div>

        {!items.length && <div className={styles.panel}>No wishlist items yet.</div>}
        <div className={styles.grid}>
          {items.map((item) => {
            const id = item.id || item._id;
            return (
              <article className={styles.card} key={id}>
                <div className={styles.cardImg}><img src={item.image || "/images/product-methi.jpg"} alt={item.name} /></div>
                <div className={styles.cardBody}>
                  <h3>{item.name}</h3>
                  <p className={styles.price}>Rs. {item.price}</p>
                  <div className={styles.cardActions}>
                    <button className={styles.brownBtn} onClick={() => dispatch(addToCart(item, 1))}>
                      <FiShoppingCart /> Add
                    </button>
                    <button className={styles.iconBtn} onClick={() => dispatch(removeFromWishlist(id))} aria-label="Remove">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
