"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/src/frontend/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const authFetch = (url, options = {}) => fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
  });

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, authFetch, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}


