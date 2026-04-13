'use client';

import React, { useEffect, useState } from 'react';
// IMPORTANT: Use the same AuthProvider as your Header to avoid state mismatch
import { useAuth } from '../Components/AuthProvider';
import type { Leader, EventItem } from '../types';
import {
    getMyLeader,
    updateMyLeader,
    listMyEvents,
    createMyEvent,
    checkinSelf,
    checkoutSelf
} from '../lib/api';

import LeaderProfile from '../Components/LeaderProfile';
import LeaderEvents from '../Components/LeaderEvents';

export default function LeaderDashboardPage() {
    const { user, loading } = useAuth();

    const [leader, setLeader] = useState<Leader | null>(null);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loadingLeader, setLoadingLeader] = useState<boolean>(true);
    const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
    const [checking, setChecking] = useState<boolean>(false);

    // Fetch all data in one effect once user is authenticated
    useEffect(() => {
        if (loading || !user || user.role !== 'LEADER') return;

        let cancelled = false;

        async function loadDashboardData() {
            setLoadingLeader(true);
            setLoadingEvents(true);
            try {
                // Run in parallel for speed
                const [leaderData, eventsData] = await Promise.all([
                    getMyLeader(),
                    listMyEvents()
                ]);

                if (!cancelled) {
                    setLeader(leaderData);
                    setEvents(eventsData);
                }
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                if (!cancelled) {
                    setLoadingLeader(false);
                    setLoadingEvents(false);
                }
            }
        }

        loadDashboardData();
        return () => { cancelled = true; };
    }, [user, loading]);

    // Auth Guard: If still checking session, show nothing or a clean spinner
    if (loading) return <div className="p-10 text-center">Verifying session...</div>;

    // If loading finished and no user, return null (AuthProvider handles redirect)
    if (!user) return null;

    if (user.role !== 'LEADER') {
        return <div className="p-10 text-center text-red-600">Access denied — leaders only.</div>;
    }

    async function handleProfileSave(payload: { bio?: string; avatar?: string; verification_badge?: string }) {
        if (!leader) return;
        const res = await updateMyLeader(payload);
        setLeader(res.leader);
    }

    async function handleCreateEvent(payload: { title: string; description?: string; start_at?: string; end_at?: string; location?: string }) {
        const resp = await createMyEvent(payload);
        setEvents((prev) => [resp.event, ...prev]);
    }

    async function handleCheckin() {
        try {
            setChecking(true);
            await checkinSelf();
            setLeader((s) => (s ? { ...s, online: true } : s));
        } finally {
            setChecking(false);
        }
    }

    async function handleCheckout() {
        await checkoutSelf();
        setLeader((s) => (s ? { ...s, online: false } : s));
    }

    return (
        <main className="max-w-4xl mx-auto p-6 space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Leader dashboard</h1>
                <div className="text-right">
                    <div className="text-sm text-gray-600">Signed in as</div>
                    <div className="font-medium">{user.name}</div>
                </div>
            </header>

            <section className="grid md:grid-cols-2 gap-6">
                <div>
                    <div className="card p-4 border rounded-lg bg-white shadow-sm">
                        <h2 className="text-lg font-medium mb-3">Presence</h2>
                        <p className="mb-2">Leader ID: <span className="font-mono text-sm">{leader?.id ?? '—'}</span></p>
                        <p className="mb-4">Online: <strong>{leader?.online ? 'Yes' : 'No'}</strong></p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCheckin}
                                disabled={checking || leader?.online || loadingLeader}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                {checking ? 'Checking in…' : 'Check in'}
                            </button>

                            <button
                                onClick={handleCheckout}
                                disabled={!leader?.online || loadingLeader}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                                Check out
                            </button>
                        </div>
                    </div>

                    <div className="mt-4">
                        {/* The "Please Login" usually lived here inside LeaderProfile if leader was null */}
                        <LeaderProfile leader={leader} loading={loadingLeader} onSave={handleProfileSave} />
                    </div>
                </div>

                <div>
                    <LeaderEvents events={events} loading={loadingEvents} onCreate={handleCreateEvent} />
                </div>
            </section>
        </main>
    );
}
