"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiShoppingBag,
  FiActivity,
  FiInfo,
  FiPackage,
  FiMail,
} from "react-icons/fi";

import "./MobileBottomNav.css";

const BOTTOM_NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: FiHome,
  },
  {
    href: "/shop",
    label: "Shop",
    icon: FiShoppingBag,
  },
  {
    href: "/health-benefits",
    label: "Health",
    icon: FiActivity,
  },
  {
    href: "/our-story/about",
    label: "About",
    icon: FiInfo,
  },
  {
    href: "/our-story/contact",
    label: "Contact",
    icon: FiMail,
  },
  {
    href: "/profile/orders",
    label: "Orders",
    icon: FiPackage,
  },
];

function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile navigation"
    >
      <div className="mobile-bottom-nav__inner">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-bottom-nav__item ${
                active
                  ? "mobile-bottom-nav__item--active"
                  : ""
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="mobile-bottom-nav__icon">
                <Icon />
              </span>

              <span className="mobile-bottom-nav__label">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;