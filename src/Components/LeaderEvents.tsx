'use client';

import React, { useState } from 'react';
import type { EventItem, CreateLeaderEventPayload } from '../types';

type Props = {
    events: EventItem[];
    loading?: boolean;
    onCreate: (payload: CreateLeaderEventPayload) => Promise<void>;
};

export default function LeaderEvents({
    events,
    loading = false,
    onCreate,
}: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startAt, setStartAt] = useState('');
    const [location, setLocation] = useState('');
    const [creating, setCreating] = useState(false);

    async function submit(e?: React.FormEvent) {
        e?.preventDefault();

        const cleanTitle = title.trim();
        if (!cleanTitle) return;

        setCreating(true);

        try {
            await onCreate({
                title: cleanTitle,
                description: description.trim() || undefined,
                start_at: startAt || undefined,
                location: location.trim() || undefined,
            });

            setTitle('');
            setDescription('');
            setStartAt('');
            setLocation('');
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="card rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-medium text-foreground">Events & News</h3>

            <form onSubmit={submit} className="mb-4 space-y-3">
                <input
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)]"
                    placeholder="Event title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />

                <input
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)]"
                    placeholder="Start (ISO) e.g. 2026-02-20T18:00"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                />

                <input
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)]"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />

                <textarea
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)]"
                    rows={3}
                    placeholder="Short description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div className="flex gap-2">
                    <button
                        className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
                        disabled={creating}
                        type="submit"
                    >
                        {creating ? 'Posting…' : 'Post event'}
                    </button>
                </div>
            </form>

            <div>
                {loading ? (
                    <div className="text-sm text-[var(--muted)]">Loading events…</div>
                ) : events.length === 0 ? (
                    <div className="text-sm text-[var(--muted)]">No events yet.</div>
                ) : (
                    <ul className="space-y-3">
                        {events.map((ev) => (
                            <li
                                key={ev.id}
                                className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3"
                            >
                                <div className="flex justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="font-medium text-foreground">{ev.title}</div>
                                        <div className="text-xs text-[var(--muted)]">
                                            {ev.start_at ? new Date(ev.start_at).toLocaleString() : 'TBD'}
                                        </div>
                                        {ev.location && (
                                            <div className="mt-1 text-xs text-[var(--muted)]">{ev.location}</div>
                                        )}
                                        {ev.description && (
                                            <p className="mt-2 text-sm text-foreground/90">{ev.description}</p>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}