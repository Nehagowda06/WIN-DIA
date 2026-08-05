// hooks/useAuth.js
// Global auth state using Supabase
// Wrap your app: <AuthProvider>{children}</AuthProvider>

"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const checkAdmin = async (accessToken) => {
    setAdminChecked(false);
    if (!accessToken) {
      setIsAdmin(false);
      setAdminChecked(true);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      setIsAdmin(Boolean(data?.user?.role === "admin"));
    } catch {
      setIsAdmin(false);
    } finally {
      setAdminChecked(true);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setLoading(false);
      checkAdmin(session?.access_token ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      checkAdmin(session?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      if (data.access_token && data.refresh_token) {
        await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
      }
    }
    return data;
  };

  const register = async (name, email, password, phone, dob, city, state, gender) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone, dob, city, state, gender }),
    });
    return res.json();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    setIsAdmin(false);
  };

  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch, isAdmin, adminChecked }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
