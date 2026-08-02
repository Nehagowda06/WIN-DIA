"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiExternalLink, FiGrid, FiPackage, FiShoppingBag, FiTag, FiUsers, FiEdit3 } from "react-icons/fi";
import styles from "./admin.module.css";

const links = [
  { href: "/admin", label: "Dashboard", icon: FiGrid },
  { href: "/admin/orders", label: "Orders", icon: FiShoppingBag },
  { href: "/admin/products", label: "Products", icon: FiPackage },
  { href: "/admin/coupons", label: "Coupons", icon: FiTag },
  { href: "/admin/users", label: "Users", icon: FiUsers },
  { href: "/admin/content", label: "Site Content", icon: FiEdit3 },
];

export default function AdminNav({ email }) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.adminBrand}>WIN-DIA <span>Admin</span></div>
      <nav className={styles.adminNav}>
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`${styles.navLink} ${pathname === href ? styles.active : ""}`}>
            <Icon /> {label}
          </Link>
        ))}
      </nav>
      <div className={styles.adminEmail}>{email}</div>
      <Link href="/" className={styles.navLink}><FiExternalLink /> Back to site</Link>
    </aside>
  );
}
