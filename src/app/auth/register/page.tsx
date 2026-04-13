// app/auth/register/page.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import AuthForm, { RegisterPayload } from '../../../Components/AuthForm';
import { register } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';

export default function RegisterPage() {
    const router = useRouter();
    const { setUser } = useAuth();

    async function handleRegister(payload: RegisterPayload) {
        const res = await register(payload);
        setUser(res.user);
        if (res.user.role === 'LEADER') {
            router.push('/leader/dashboard');
        } else if (res.user.role === 'ADMIN') {
            router.push('/admin/leaders');
        } else {
            router.push('/');
        }
    }

    return (
        <main className="max-w-3xl mx-auto p-6">
            <AuthForm mode="register" onSubmit={handleRegister} />
        </main>
    );
}
