'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm, { LoginPayload } from '@/Components/AuthForm';
import { login } from '@/lib/api';
import { useAuth } from '@/Components/AuthProvider';

const AUTH_TOKEN_KEY = 'encounter_token';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl') ?? '/';
    const { setUser } = useAuth();

    async function handleLogin(payload: LoginPayload) {
        const res = await login(payload);

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

        router.replace(returnUrl);
    }

    return (
        <main className="mx-auto max-w-md p-6">
            <h1 className="mb-6 text-2xl font-semibold">Login</h1>
            <AuthForm mode="login" onSubmit={handleLogin} />
        </main>
    );
}