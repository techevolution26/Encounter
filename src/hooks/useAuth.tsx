// hooks/useAuth.tsx
'use client';
import { useEffect, useState } from 'react';
import type { User } from '../types';
import { me } from '../lib/api';


export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    // Initialize loading based on token presence to avoid unnecessary flashes
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let mounted = true;

        async function checkAuth() {
            const token = localStorage.getItem('token');
            if (!token) {
                if (mounted) setLoading(false);
                return;
            }

            try {
                const u = await me();
                if (mounted) setUser(u);
            } catch (err) {
                // If token is invalid, clear it
                localStorage.removeItem('token');
                if (mounted) setUser(null);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        checkAuth();
        return () => { mounted = false; };
    }, []);

    const logout = async () => {
        try {
            localStorage.removeItem('token');
            setUser(null);
            window.location.href = '/auth/login';
        } catch { }
    }
    return { user, setUser, loading, logout };
}

