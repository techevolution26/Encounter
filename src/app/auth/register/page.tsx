// app/auth/register/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AuthForm, { RegisterPayload, LoginPayload } from '../../../Components/AuthForm';
import { register } from '../../../lib/api';
import { useAuthContext } from '../../../Components/AuthProvider';

export default function RegisterPage() {
    const router = useRouter();
    const { setUser } = useAuthContext();

    async function handleRegister(payload: RegisterPayload | LoginPayload) {
        // register returns { user, token }
        const res = await register(payload as RegisterPayload);
        setUser(res.user);
        // redirect by role
        if (res.user.role === 'LEADER') {
            router.push('/leader/dashboard');
        } else if (res.user.role === 'ADMIN') {
            router.push('/admin/leaders');
        } else {
            router.push('/');
        }
    }

    return (
        <main style={{ padding: 24 }}>
            <h1>Register</h1>
            <AuthForm mode="register" onSubmit={handleRegister} />
        </main>
    );
}
