// components/AuthProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { me as apiMe, logout as apiLogout } from '../lib/api';
import { useRouter } from 'next/navigation';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await apiMe();
        if (mounted) setUser(u);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem('encounter_token');
      setUser(null);
      router.push('/auth/login');
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}
