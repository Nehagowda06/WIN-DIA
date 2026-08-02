import Image from "next/image";
import Link from "next/link";

import cartIcon from "@/src/frontend/assets/icons/cart.png";
import heartIcon from "@/src/frontend/assets/icons/heart.png";
import profileIcon from "@/src/frontend/assets/icons/profile.png";
import windiaLogo from "@/src/frontend/assets/logos/windia-logo.png";

import styles from "./HeroNavbar.module.scss";

type NavigationItem = {
  readonly href: string;
  readonly label: string;
  readonly isActive?: boolean;
};

const navigationItems: readonly NavigationItem[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop", isActive: true },
  { href: "/#our-story", label: "Our Story" },
  { href: "/#health-benefits", label: "Health Benefits" },
];

const utilityLinks = [
  { href: "/wishlist", icon: heartIcon, label: "Wishlist" },
  { href: "/cart", icon: cartIcon, label: "Shopping cart" },
  { href: "/account", icon: profileIcon, label: "Your account" },
] as const;

/** Navigation that is visually layered over the shop hero. */
export function HeroNavbar() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Windia home">
        <Image
          className={styles.logo}
          src={windiaLogo}
          alt=""
          priority
          sizes="(max-width: 640px) 72px, 108px"
        />
        <span className={styles.brandCopy}>
          <span className={styles.brandName}>WIN-DIA</span>
          <span className={styles.brandTagline}>a divine crunch</span>
        </span>
      </Link>

      <nav className={styles.navigation} aria-label="Primary navigation">
        {navigationItems.map(({ href, label, isActive }) => (
          <Link
            key={href}
            className={styles.navigationLink}
            href={href}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className={styles.utilities}>
        {utilityLinks.map(({ href, icon, label }) => (
          <Link key={href} className={styles.utilityLink} href={href} aria-label={label}>
            <Image src={icon} alt="" sizes="(max-width: 640px) 25px, 32px" />
          </Link>
        ))}
      </div>
    </header>
  );
}
