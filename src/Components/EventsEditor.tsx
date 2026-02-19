// components/EventsEditor.tsx
'use client';
import React, { useEffect, useState } from 'react';
import type { EventItem } from '../types';
import { listMyEvents, createMyEvent, deleteMyEvent } from '../lib/api';

export default function EventsEditor() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [title, setTitle] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        (async () => {
            try {
                const e = await listMyEvents();
                setEvents(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function add() {
        if (!title.trim()) return;
        const r = await createMyEvent({ title, start_at: new Date().toISOString() });
        setEvents((s) => [r.event, ...s]);
        setTitle('');
    }

    async function remove(id: string) {
        await deleteMyEvent(id);
        setEvents((s) => s.filter((ev) => ev.id !== id));
    }

    if (loading) return <div>Loading events…</div>;

    return (
        <section>
            <h3>Events</h3>
            <div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
                <button onClick={add}>Create</button>
            </div>

            <ul>
                {events.map((ev) => (
                    <li key={ev.id}>
                        <div>{ev.title} — {ev.start_at}</div>
                        <div><button onClick={() => remove(ev.id)}>Delete</button></div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
