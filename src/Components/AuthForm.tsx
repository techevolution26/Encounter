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

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === 'login') {
                const payload: LoginPayload = { email, password };
                await onSubmit(payload);
            } else {
                const payload: RegisterPayload = {
                    name: name.trim() || undefined,
                    email: email.trim(),
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
        <form onSubmit={handleSubmit} className="max-w-lg w-full bg-white p-6 rounded-md shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{mode === 'login' ? 'Login' : 'Create an account'}</h2>

            {mode === 'register' && (
                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name (optional)"
                    />
                </div>
            )}

            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                />
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            {mode === 'register' && (
                <>
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Register as</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="USER">User</option>
                            <option value="LEADER">Leader</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Tip: Admin registration may be disabled on the server for security.
                        </p>
                    </div>
                </>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
                </button>

                <button
                    type="button"
                    onClick={() => {
                        // quick client-side reset (not submit)
                        setName('');
                        setEmail('');
                        setPassword('');
                        setPasswordConfirmation('');
                        setError(null);
                    }}
                    className="text-sm text-gray-600"
                >
                    Reset
                </button>
            </div>

            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </form>
    );
}
