// components/AuthProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '../types';
import { me as apiMe, logout as apiLogout } from '../lib/api';
import { useRouter } from 'next/navigation';

/**
 * Module-level singleton promise so multiple mounts share the same auth request.
 * This avoids duplicate network calls (StrictMode or remounts).
 */
let authInitPromise: Promise<User | null> | null = null;

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const safeSetUser = (u: User | null) => {
    setUser(prev => {
      // fast path: same reference
      if (prev === u) return prev;
      // if both null -> no change
      if (!prev && !u) return prev;
      // if both have id and equal -> no change
      if (prev?.id && u?.id && prev.id === u.id) {
        // optionally do a shallow merge so fields update only when necessary:
        // if you want to update profile fields when they differ, do a shallow compare:
        const haveSame = prev.name === u.name && prev.email === u.email && prev.avatar === u.avatar;
        if (haveSame) return prev;
        return u;
      }
      return u;
    });
  };

  // Components/AuthProvider.tsx - Update this part!
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      // 1. Guard against SSR
      if (typeof window === 'undefined') return;

      try {
        const token = localStorage.getItem('encounter_token');

        if (!token) {
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // Call your API
        const u = await apiMe();

        if (!cancelled) {
          setUser(u);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        if (!cancelled) {
          setUser(null);
          localStorage.removeItem('encounter_token'); // Clean up bad token
        }
      } finally {
        if (!cancelled) {
          setLoading(false); // CRITICAL: This must run no matter what
        }
      }
    }

    initAuth();
    return () => { cancelled = true; };
  }, []);




  // logout helper: call backend, clear token and state, then navigate
  async function logout() {
    try {
      await apiLogout();
    } catch (err) {
      // ignore backend failure but continue client logout
      console.warn('Logout API failed', err);
    } finally {
      localStorage.removeItem('encounter_token');
      setUser(null);
      router.push('/auth/login');
    }
  }

 return (
  <AuthContext.Provider value={{ user, loading, setUser: safeSetUser, logout }}>
    {children}
  </AuthContext.Provider>
);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
