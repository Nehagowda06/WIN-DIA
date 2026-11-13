"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHeart, FiShoppingCart, FiGrid, FiTruck } from "react-icons/fi";
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

// Guests have no Orders page in their profile, so they get a direct Track Order link.
const GUEST_LINK = { href: "/track-order", label: "Track Order" };

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

  const visibleLinks = user ? NAV_LINKS : [...NAV_LINKS, GUEST_LINK];

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>

        {/* LOGO */}
        <Link href="/" className={styles.brand}>
          <div className={styles.logoWrap}>
            <img src="/images/windia-logo.png" alt="WIN-DIA" />
          </div>

          <div className={styles.brandWordmark}>
            <span className={styles.brandName}>
              WIN-DIA
            </span>

            <span className={styles.brandTagline}>
              Start your second innings
            </span>
          </div>
        </Link>

        {/* NAV LINKS */}
        <div className={styles.links}>

          {/* Text links: hidden on mobile by the CSS */}
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navTextLink} ${
                isLinkActive(link.href) ? styles.activeLink : ""
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* WISHLIST */}
          <Link href="/wishlist">
            <FiHeart /> {wishCount}
          </Link>

          {/* CART */}
          <Link href="/cart">
            <FiShoppingCart /> {cartCount}
          </Link>

          {/* TRACK ORDER ICON (guests only, mobile only; desktop uses the text link) */}
          {!user && (
            <Link
              href="/track-order"
              className={styles.trackIcon}
              aria-label="Track Order"
              title="Track Order"
            >
              <FiTruck />
            </Link>
          )}

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