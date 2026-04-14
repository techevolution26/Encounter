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
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [role, setRole] = useState<Role>('USER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (mode === 'register') {
            if (password.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
            }

            if (new TextEncoder().encode(password).length > 72) {
                setError('Password is too long for the current auth setup. Keep it under 72 bytes.');
                return;
            }

            if (password !== passwordConfirmation) {
                setError('Passwords do not match.');
                return;
            }
        }

        setLoading(true);

        try {
            if (mode === 'login') {
                const payload: LoginPayload = {
                    email: email.trim(),
                    password,
                };
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
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
        >
            <h2 className="mb-4 text-xl font-semibold text-foreground">
                {mode === 'login' ? 'Login' : 'Create an account'}
            </h2>

            {mode === 'register' && (
                <div className="mb-3">
                    <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
                    <input
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)]"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name (optional)"
                    />
                </div>
            )}

            <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                <input
                    type="email"
                    required
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                />
            </div>

            <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-foreground">Password</label>
                <input
                    type="password"
                    required
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground outline-none transition focus:border-[var(--primary)]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            {mode === 'register' && (
                <>
                    <div className="mb-3">
                        <label className="mb-1 block text-sm font-medium text-foreground">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground outline-none transition focus:border-[var(--primary)]"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium text-foreground">
                            Register as
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground outline-none transition focus:border-[var(--primary)]"
                        >
                            <option value="USER">User</option>
                            <option value="LEADER">Leader</option>
                            {/* <option value="ADMIN">Admin</option> */}
                        </select>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                            Tip: Leader registration may be disabled on the server for security.
                        </p>
                    </div>
                </>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
                >
                    {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setName('');
                        setEmail('');
                        setPassword('');
                        setPasswordConfirmation('');
                        setError(null);
                    }}
                    className="text-sm text-[var(--muted)] transition hover:text-foreground"
                >
                    Reset
                </button>
            </div>

            {error && <div className="mt-3 text-sm text-[var(--danger)]">{error}</div>}
        </form>
    );
}