"use client";

import Link from "next/link";
import { FiInstagram, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <Link href="/" className={styles.brand}>
            <img src="/images/windia-logo.png" alt="WIN-DIA" />
            <span>WIN-DIA</span>
          </Link>
          <p>
            Premium khakhra and thins crafted for everyday Indian snacking:
            crisp, flavourful, and easy to share.
          </p>
        </div>

        <div className={styles.group}>
          <h3>Explore</h3>
          <Link href="/">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/our-story/about">About</Link>
          <Link href="/health-benefits">Health Benefits</Link>
        </div>

        <div className={styles.group}>
          <h3>Account</h3>
          <Link href="/profile">Profile</Link>
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/account/orders">Orders</Link>
        </div>

        <div className={styles.group}>
          <h3>Contact</h3>
          <span><FiMapPin /> Mysuru, Karnataka</span>
          <span><FiPhone /> +91 91483 39947</span>
          <span><FiMail /> hello@windia.in</span>
          <span><FiInstagram /> @windia</span>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} WIN-DIA</span>
        <span>Made for healthy crunch lovers.</span>
      </div>
    </footer>
  );
}
