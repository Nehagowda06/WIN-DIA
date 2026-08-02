"use client";
import Link from "next/link";
import { FiHeart, FiShoppingCart, FiUser } from "react-icons/fi";
import { useSelector } from "react-redux";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "@/app/storefront.module.css";

export default function StoreNav() {
  const cartCount = useSelector((s) => s.cart.cartItems.reduce((sum, item) => sum + Number(item.qty || 1), 0));
  const wishCount = useSelector((s) => s.wishlist.wishlistItems.length);
  const { user } = useAuth();

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand}>
          <img src="/images/windia-logo.png" alt="WIN-DIA" />
          <span>WIN-DIA</span>
        </Link>
        <div className={styles.links}>
          <Link href="/shop">Shop</Link>
          <Link href="/wishlist"><FiHeart /> {wishCount}</Link>
          <Link href="/cart"><FiShoppingCart /> {cartCount}</Link>
          <Link href={user ? "/account" : "/login"} className={styles.pill}><FiUser /> {user ? "Account" : "Login"}</Link>
        </div>
      </div>
    </nav>
  );
}
