"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { handleLogout } from '@/src/frontend/lib/auth/logout';

/* === Icon set === */
const icons = {
  profile: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  address: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  wishlist: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  ),
  orders: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6l1 4H8l1-4z" />
      <path d="M4 7h16l-1.5 13a2 2 0 01-2 2h-9a2 2 0 01-2-2L4 7z" />
      <path d="M9 11v6M15 11v6" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};

export default function ProfileSidebar({ profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const navLinks = [
    { href: '/profile', label: 'Profile', icon: icons.profile },
    { href: '/profile/addresses', label: 'Addresses', icon: icons.address },
    { href: '/wishlist', label: 'Wishlist', icon: icons.wishlist },
    { href: '/account/orders', label: 'Orders', icon: icons.orders },
  ];

  return (
    <aside className="profile-sidebar">
      <div className="profile-sidebar-top">
        <div className="profile-avatar-block">
          <div className="profile-avatar-ring">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="profile-avatar" />
            ) : (
              <div className="profile-avatar">{getInitials(profile?.full_name)}</div>
            )}
          </div>
          <p className="profile-name">{profile?.full_name}</p>
          <p className="profile-email">{profile?.email}</p>
        </div>

        <button
          className="profile-hamburger-btn"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <nav className={`profile-nav ${mobileOpen ? 'profile-nav-open' : ''}`}>
        {navLinks.map((link) => (
           <a key={link.href}
            href={link.href}
            className={`profile-nav-item ${pathname === link.href ? 'profile-nav-item-active' : ''}`}
          >
            <span className="profile-nav-icon">{link.icon}</span>
            {link.label}
          </a>
        ))}

        <div className="profile-logout-item">
          <button className="profile-nav-item" onClick={() => handleLogout(router)}>
            <span className="profile-nav-icon">{icons.logout}</span>
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
}
