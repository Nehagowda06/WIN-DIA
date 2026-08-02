"use client";

import { useCallback } from "react";
import type { ReactNode } from "react";

type AuthProviderProps = {
  readonly children: ReactNode;
};

/**
 * Temporary compatibility boundary until Supabase Auth is connected.
 * It deliberately provides no session or identity management.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return children;
}

/**
 * Minimal unauthenticated contract for routes that are already wired for Auth.
 * Replace this implementation when Supabase Auth is introduced.
 */
export function useAuth() {
  const authFetch = useCallback((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init), []);
  const logout = useCallback(async () => undefined, []);

  return {
    user: null,
    loading: false,
    authFetch,
    logout,
  };
}
