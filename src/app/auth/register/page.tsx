'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AuthForm, { RegisterPayload } from '@/Components/AuthForm';
import { register } from '@/lib/api';
import { useAuth } from '@/Components/AuthProvider';

const AUTH_TOKEN_KEY = 'encounter_token';

export default function RegisterPage() {
    const router = useRouter();
    const { setUser } = useAuth();

    async function handleRegister(payload: RegisterPayload) {
        const res = await register(payload);

        window.localStorage.setItem(AUTH_TOKEN_KEY, res.token);
        setUser(res.user);

        if (res.user.role === 'LEADER') {
            router.replace('/leader/dashboard');
            return;
        }

        if (res.user.role === 'ADMIN') {
            router.replace('/admin/leaders');
            return;
        }

        router.replace('/');
    }

    return (
        <main className="mx-auto max-w-3xl p-6">
            <AuthForm mode="register" onSubmit={handleRegister} />
        </main>
    );
}