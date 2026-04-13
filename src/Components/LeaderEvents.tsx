// components/LeaderEvents.tsx
'use client';

import React, { useState } from 'react';
import type { EventItem } from '../types';

type Props = {
    events: EventItem[];
    loading?: boolean;
    onCreate: (payload: { title: string; description?: string; start_at?: string; end_at?: string; location?: string }) => Promise<void>;
};

export default function LeaderEvents({ events, loading = false, onCreate }: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startAt, setStartAt] = useState<string>('');
    const [creating, setCreating] = useState(false);

    async function submit(e?: React.FormEvent) {
        e?.preventDefault();
        setCreating(true);
        try {
            await onCreate({ title: title.trim(), description: description.trim() || undefined, start_at: startAt || undefined });
            setTitle('');
            setDescription('');
            setStartAt('');
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="card p-4">
            <h3 className="text-lg font-medium mb-3">Events & News</h3>

            <form onSubmit={submit} className="space-y-2 mb-4">
                <input className="w-full border rounded px-3 py-2" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <input className="w-full border rounded px-3 py-2" placeholder="Start (ISO) e.g. 2026-02-20T18:00" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                <textarea className="w-full border rounded px-3 py-2" rows={3} placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-green-600 text-white rounded" disabled={creating}>{creating ? 'Posting…' : 'Post event'}</button>
                </div>
            </form>

            <div>
                {loading ? (
                    <div className="text-sm text-gray-500">Loading events…</div>
                ) : events.length === 0 ? (
                    <div className="text-sm text-gray-500">No events yet.</div>
                ) : (
                    <ul className="space-y-2">
                        {events.map((ev) => (
                            <li key={ev.id} className="border rounded p-3 bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium">{ev.title}</div>
                                        <div className="text-xs text-gray-500">{ev.start_at ? new Date(ev.start_at).toLocaleString() : 'TBD'}</div>
                                        {ev.description && <p className="mt-2 text-sm">{ev.description}</p>}
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
