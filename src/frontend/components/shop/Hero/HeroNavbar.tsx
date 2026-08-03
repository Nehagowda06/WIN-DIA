"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import brownCartIcon from "@/src/frontend/assets/icons/cart.png";
import offWhiteCartIcon from "@/src/frontend/assets/icons/cart-offwhite.png";
import brownHeartIcon from "@/src/frontend/assets/icons/heart.png";
import offWhiteHeartIcon from "@/src/frontend/assets/icons/heart-offwhite.png";
import brownProfileIcon from "@/src/frontend/assets/icons/profile.png";
import offWhiteProfileIcon from "@/src/frontend/assets/icons/profile-offwhite.png";
import windiaLogo from "@/src/frontend/assets/logos/windia-logo.png";

import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "./HeroNavbar.module.scss";

type NavigationItem = {
  readonly href: string;
  readonly label: string;
  readonly isActive?: boolean;
};

const navigationItems: readonly NavigationItem[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop", isActive: true },
  { href: "/our-story", label: "Our Story" },
  { href: "/health-benefits", label: "Health Benefits" },
];

/** Fixed site navigation whose theme follows the visible page section. */
export function Navbar() {
  const [theme, setTheme] = useState("brown");
  const { user } = useAuth();
  const utilityIconVariant = theme === "off-white" ? "off-white" : "brown";

  const utilityLinks = [
    {
      href: "/wishlist",
      icons: { brown: brownHeartIcon, "off-white": offWhiteHeartIcon },
      label: "Wishlist",
    },
    {
      href: "/cart",
      icons: { brown: brownCartIcon, "off-white": offWhiteCartIcon },
      label: "Shopping cart",
    },
    {
      href: user ? "/profile" : "/login",
      icons: { brown: brownProfileIcon, "off-white": offWhiteProfileIcon },
      label: user ? "Your profile" : "Log in",
    },
  ] as const;

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main > section[data-navbar-theme]"),
    );

    const updateTheme = () => {
      const activeSection = sections
        .map((section) => {
          const bounds = section.getBoundingClientRect();
          const visibleHeight = Math.max(
            0,
            Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0),
          );

          return { section, visibleHeight };
        })
        .sort((first, second) => second.visibleHeight - first.visibleHeight)[0]?.section;
      const activeTheme = activeSection?.getAttribute("data-navbar-theme");

      if (activeTheme) {
        setTheme(activeTheme);
      }
    };

    updateTheme();
    window.addEventListener("scroll", updateTheme, { passive: true });
    window.addEventListener("resize", updateTheme);

    const observer =
      typeof IntersectionObserver === "undefined"
        ? undefined
        : new IntersectionObserver(updateTheme, { threshold: [0.2, 0.5, 0.8] });

    sections.forEach((section) => observer?.observe(section));

    return () => {
      window.removeEventListener("scroll", updateTheme);
      window.removeEventListener("resize", updateTheme);
      observer?.disconnect();
    };
  }, []);

  return (
    <header className={styles.header} data-navbar-theme={theme}>
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
        {utilityLinks.map(({ href, icons, label }) => (
          <Link key={href} className={styles.utilityLink} href={href} aria-label={label}>
            <Image src={icons[utilityIconVariant]} alt="" sizes="(max-width: 640px) 25px, 32px" />
          </Link>
        ))}
      </div>
    </header>
  );
}
