"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHeart, FiShoppingCart, FiGrid } from "react-icons/fi";
import { useSelector } from "react-redux";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "@/app/storefront.module.css";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/our-story/about", label: "About" },
  { href: "/health-benefits", label: "Health Benefits" },
  { href: "/our-story/contact", label: "Contact" },
];

export default function StoreNav() {
  const { user, isAdmin, adminChecked } = useAuth();
  const pathname = usePathname();
  const showAdminLink = user && adminChecked && isAdmin;
  const cartCount = useSelector((s) =>
    s.cart.cartItems.reduce((sum, item) => sum + Number(item.qty || 1), 0)
  );

  const wishCount = useSelector((s) => s.wishlist.wishlistItems.length);

  const isLinkActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>

        {/* LOGO */}
        <Link href="/" className={styles.brand}>
  <div className={styles.logoWrap}>
    <img src="/images/windia-logo.png" alt="WIN-DIA" />
    <sup className={styles.logoTrademark}>™</sup>
  </div>

  <div className={styles.brandWordmark}>
    <span className={styles.brandName}>
      WIN-DIA
    </span>
  </div>
</Link>

        {/* NAV LINKS */}
        <div className={styles.links}>

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isLinkActive(link.href) ? styles.activeLink : ""}
            >
              {link.label}
            </Link>
          ))}

          

          {/* WISHLIST */}
          <Link href="/wishlist">
            <FiHeart /> {user ? wishCount : 0}
          </Link>

          {/* CART */}
          <Link href="/cart">
            <FiShoppingCart /> {user ? cartCount : 0}
          </Link>

          {/* ADMIN DASHBOARD LINK (visible only to admin accounts) */}
          {showAdminLink && (
            <Link href="/admin" className={styles.pill}>
              <FiGrid />
              Admin
            </Link>
          )}

          {/* LOGIN / PROFILE */}
          {user ? (
            <Link href="/profile" className={styles.pill}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
                width={16} height={16}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </Link>
          ) : (
            <Link href="/login" className={styles.pill}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
                width={16} height={16}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Login
            </Link>
          )}

        </div>
      </div>

      
    </nav>
  );
}