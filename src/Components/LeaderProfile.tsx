'use client';

import React, { useEffect, useState } from 'react';
import type { Leader, UpdateLeaderPayload } from '../types';

type Props = {
    leader: Leader | null;
    loading?: boolean;
    onSave: (payload: UpdateLeaderPayload) => Promise<void>;
};

export default function LeaderProfile({
    leader,
    loading = false,
    onSave,
}: Props) {
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    const [verificationBadge, setVerificationBadge] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        setBio(leader?.bio ?? '');
        setAvatar(leader?.avatar ?? '');
        setVerificationBadge(leader?.verification_badge ?? '');
    }, [leader]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await onSave({
                bio: bio.trim() || null,
                avatar: avatar.trim() || null,
                verification_badge: verificationBadge.trim() || null,
            });
            setMessage('Profile saved');
        } catch (error) {
            console.error('Failed to save leader profile', error);
            setMessage('Save failed');
        } finally {
            setSaving(false);
            window.setTimeout(() => setMessage(null), 2500);
        }
    }

    return (
        <section className="card rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Leader profile</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={5}
                        disabled={loading || saving}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)] disabled:opacity-60"
                        placeholder="Write a short leader bio"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Avatar URL</label>
                    <input
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        disabled={loading || saving}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)] disabled:opacity-60"
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Verification badge</label>
                    <input
                        value={verificationBadge}
                        onChange={(e) => setVerificationBadge(e.target.value)}
                        disabled={loading || saving}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)] disabled:opacity-60"
                        placeholder="Optional badge label"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={loading || saving}
                        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save profile'}
                    </button>

                    {message && (
                        <span className="text-sm text-[var(--muted)]">{message}</span>
                    )}
                </div>
            </form>
        </section>
    );
}