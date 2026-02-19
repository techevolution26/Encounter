// hooks/useAuth.tsx
'use client';
import { useEffect, useState } from 'react';
import type { User } from '../types';
import { me } from '../lib/api';


export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const u = await me();
                if (mounted) setUser(u);
            } catch {
                if (mounted) setUser(null);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const logout = () => setUser(null);

    return { user, setUser, loading, logout };
}

