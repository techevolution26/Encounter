'use client';

import React, { useEffect, useState } from 'react';
import type { EventItem } from '@/types';
import { getPublicEvents } from '@/lib/api';

export default function EventsPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadEvents() {
            try {
                const result = await getPublicEvents();
                if (!cancelled) {
                    setEvents(result);
                }
            } catch (error) {
                console.error('Failed to load events', error);
                if (!cancelled) {
                    setError(error instanceof Error ? error.message : 'Failed to load events');
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

    if (loading) return <div className="card">Loading events…</div>;
    if (error) return <div className="card text-red-600">Error: {error}</div>;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Events & News</h2>

            <div className="grid gap-4">
                {events.length === 0 && <div className="card">No events found</div>}

                {events.map((event) => {
                    const start = event.start_at ? new Date(event.start_at) : null;
                    const startLabel = start ? start.toLocaleString() : 'TBD';

                    return (
                        <article key={event.id} className="card p-4">
                            <h3 className="mb-1 text-lg font-medium">{event.title}</h3>

                            <div className="mb-2 text-sm text-gray-600">
                                {startLabel} — {event.location ?? 'Online / TBD'}
                            </div>

                            {event.description && (
                                <p className="mt-2 text-sm text-gray-800">{event.description}</p>
                            )}

                            {event.leader && (
                                <div className="mt-3 flex items-center gap-3 text-sm text-gray-700">
                                    <img
                                        src={event.leader.avatar ?? '/default-avatar.png'}
                                        alt={event.leader_name ?? 'leader'}
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                    <div>{event.leader_name ?? 'Leader'}</div>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}