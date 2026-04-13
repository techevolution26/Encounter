'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { me as apiMe, logout as apiLogout } from '@/lib/api';

const AUTH_TOKEN_KEY = 'encounter_token';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      try {
        const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

        if (!token) {
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const me = await apiMe();

        if (!cancelled) {
          setUser(me);
        }
      } catch (error) {
        console.error('Auth init failed:', error);
        window.localStorage.removeItem(AUTH_TOKEN_KEY);

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    try {
      await apiLogout();
    } catch (error) {
      console.warn('Logout API failed:', error);
    } finally {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      router.replace('/auth/login');
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}