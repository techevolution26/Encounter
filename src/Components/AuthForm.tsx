// components/AuthForm.tsx
'use client';

import React, { useState } from 'react';
import type { Role } from '../types';

export type RegisterPayload = {
    name?: string;
    email: string;
    password: string;
    password_confirmation: string;
    role?: Role;
};

export type LoginPayload = {
    email: string;
    password: string;
};

type Props = {
    mode: 'login' | 'register';
    onSubmit: (payload: RegisterPayload | LoginPayload) => Promise<void>;
};

export default function AuthForm({ mode, onSubmit }: Props) {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
    const [role, setRole] = useState<Role>('USER');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === 'login') {
                const payload: LoginPayload = { email, password };
                await onSubmit(payload);
            } else {
                const payload: RegisterPayload = {
                    name,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                    role,
                };
                await onSubmit(payload);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unexpected error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
            {mode === 'register' && (
                <>
                    <label>Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required />
                </>
            )}

            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

            <label>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />

            {mode === 'register' && (
                <>
                    <label>Confirm password</label>
                    <input
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        type="password"
                        required
                    />

                    <label>Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                        <option value="USER">User</option>
                        <option value="LEADER">Leader</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </>
            )}

            <div style={{ marginTop: 12 }}>
                <button type="submit" disabled={loading}>
                    {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
                </button>
            </div>

            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </form>
    );
}
