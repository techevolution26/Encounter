'use client';

import React, { useEffect, useState } from 'react';
import type { EventItem } from '../types';
import { listMyEvents, createMyEvent, deleteMyEvent } from '../lib/api';

export default function EventsEditor() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadEvents() {
            try {
                const result = await listMyEvents();
                if (!cancelled) {
                    setEvents(result);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadEvents();
        return () => {
            cancelled = true;
        };
    }, []);

    async function add() {
        const cleanTitle = title.trim();
        if (!cleanTitle) return;

        setCreating(true);
        try {
            const result = await createMyEvent({
                title: cleanTitle,
                start_at: new Date().toISOString(),
            });

            setEvents((prev) => [result.event, ...prev]);
            setTitle('');
        } finally {
            setCreating(false);
        }
    }

    async function remove(id: string) {
        setRemovingId(id);
        try {
            await deleteMyEvent(id);
            setEvents((prev) => prev.filter((event) => event.id !== id));
        } finally {
            setRemovingId(null);
        }
    }

    if (loading) {
        return <div className="card text-[var(--muted)]">Loading events…</div>;
    }

    return (
        <section className="card rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Events</h3>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-foreground placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)]"
                />
                <button
                    onClick={add}
                    disabled={creating || !title.trim()}
                    className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
                >
                    {creating ? 'Creating…' : 'Create'}
                </button>
            </div>

            <ul className="space-y-3">
                {events.map((ev) => (
                    <li
                        key={ev.id}
                        className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div>
                            <div className="font-medium text-foreground">{ev.title}</div>
                            <div className="text-sm text-[var(--muted)]">
                                {ev.start_at ? new Date(ev.start_at).toLocaleString() : 'TBD'}
                            </div>
                        </div>

                        <button
                            onClick={() => remove(ev.id)}
                            disabled={removingId === ev.id}
                            className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-50"
                        >
                            {removingId === ev.id ? 'Deleting…' : 'Delete'}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}