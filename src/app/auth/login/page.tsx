// app/auth/login/page.tsx
'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm, { LoginPayload } from '../../../Components/AuthForm';
import { login } from '../../../lib/api';
import { useAuth } from '../../../Components/AuthProvider';

export default function LoginPage() {
    const router = useRouter();
    const search = useSearchParams();
    const returnUrl = search?.get('returnUrl') ?? '/';
    const { setUser } = useAuth();

    async function handleLogin(payload: LoginPayload) {
        const res = await login(payload);
        // login() returns { user, token } per our api typing
        setUser(res.user);
        // redirect based on role
        if (res.user.role === 'LEADER') {
            router.push('/leader/dashboard');
        } else if (res.user.role === 'ADMIN') {
            router.push('/admin/leaders');
        } else {
            router.push(returnUrl);
        }
    }

    return (
        <main style={{ padding: 24 }}>
            <h1>Login</h1>
            <AuthForm mode="login" onSubmit={handleLogin} />
        </main>
    );
}
