"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/frontend/lib/supabase/client';
import { handleLogout } from '@/src/frontend/lib/auth/logout';
import { getInitials } from '@/src/frontend/lib/avatar';
import { PersonIcon, PinIcon, HeartIcon, CartIcon, LogoutIcon } from '@/src/frontend/components/icons/Icons';

export default function ProfileMenu() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        setProfile(data);
      }
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* === Logged out === */
  if (!user) {
    return (
      <button className="profile-menu-icon-btn" onClick={() => router.push('/login')} aria-label="Log in">
        <PersonIcon color="#462c19" />
      </button>
    );
  }

  const initials = getInitials(profile?.full_name);

  /* === Logged in === */
  return (
    <div className="profile-menu-wrapper" ref={wrapperRef}>
      <button
        className="profile-menu-initials"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        ) : initials ? (
          initials
        ) : (
          <PersonIcon color="#F9F7F3" />
        )}
      </button>

      {open && (
        <div className="profile-menu-dropdown">
          <a href="/profile" className="profile-menu-item"><PersonIcon size={15} /> Profile</a>
          <a href="/profile/addresses" className="profile-menu-item"><PinIcon size={15} /> Address</a>
          <a href="/wishlist" className="profile-menu-item"><HeartIcon size={15} /> Wishlist</a>
          <a href="/cart" className="profile-menu-item"><CartIcon size={15} /> Cart</a>
          <div className="profile-menu-divider">
            <button className="profile-menu-item" onClick={() => handleLogout(router)}>
              <LogoutIcon size={15} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}