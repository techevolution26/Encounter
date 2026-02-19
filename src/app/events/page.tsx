'use client';

import React, { useEffect, useState } from 'react';
import type { EventItem } from '../../types';
import { getPublicEvents } from '../../lib/api';

export default function EventsPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const e = await getPublicEvents();
                setEvents(e);
            } catch (err) {
                console.error('Failed to load events', err);
                setError(err instanceof Error ? err.message : 'Failed to load events');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div className="card">Loading events…</div>;
    if (error) return <div className="card text-red-600">Error: {error}</div>;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Events & News</h2>
            <div className="grid gap-4">
                {events.length === 0 && <div className="card">No events found</div>}
                {events.map((ev) => {
                    const start = ev.start_at ? new Date(ev.start_at) : null;
                    const startLabel = start ? start.toLocaleString() : 'TBD';
                    return (
                        <article key={ev.id} className="card p-4">
                            <h3 className="text-lg font-medium mb-1">{ev.title}</h3>
                            <div className="text-sm text-gray-600 mb-2">{startLabel} — {ev.location ?? 'Online / TBD'}</div>
                            {ev.description && <p className="mt-2 text-sm text-gray-800">{ev.description}</p>}
                            {ev.leader && (
                                <div className="mt-3 flex items-center gap-3 text-sm text-gray-700">
                                    <img src={ev.leader.avatar ?? '/default-avatar.png'} alt={ev.leader_name ?? 'leader'} className="w-8 h-8 rounded-full object-cover" />
                                    <div>{ev.leader_name}</div>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
