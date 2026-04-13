'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/Components/AuthProvider';
import type {
  Leader,
  EventItem,
  UpdateLeaderPayload,
  CreateLeaderEventPayload,
} from '@/types';
import {
  getMyLeader,
  updateMyLeader,
  listMyEvents,
  createMyEvent,
  checkinSelf,
  checkoutSelf,
} from '@/lib/api';

import LeaderProfile from '@/Components/LeaderProfile';
import LeaderEvents from '@/Components/LeaderEvents';

export default function LeaderDashboardPage() {
  const { user, loading } = useAuth();

  const [leader, setLeader] = useState<Leader | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingLeader, setLoadingLeader] = useState<boolean>(true);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);

  useEffect(() => {
    if (loading || !user || user.role !== 'LEADER') return;

    let cancelled = false;

    async function loadDashboardData() {
      setLoadingLeader(true);
      setLoadingEvents(true);

      try {
        const [leaderData, eventsData] = await Promise.all([
          getMyLeader(),
          listMyEvents(),
        ]);

        if (!cancelled) {
          setLeader(leaderData);
          setEvents(eventsData);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        if (!cancelled) {
          setLoadingLeader(false);
          setLoadingEvents(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  async function handleProfileSave(payload: UpdateLeaderPayload) {
    const res = await updateMyLeader(payload);
    setLeader(res.leader);
  }

  async function handleCreateEvent(payload: CreateLeaderEventPayload) {
    const res = await createMyEvent(payload);
    setEvents((prev) => [res.event, ...prev]);
  }

  async function handleCheckin() {
    try {
      setChecking(true);
      await checkinSelf();
      setLeader((prev) => (prev ? { ...prev, online: true } : prev));
    } catch (error) {
      console.error('Checkin failed', error);
    } finally {
      setChecking(false);
    }
  }

  async function handleCheckout() {
    try {
      setChecking(true);
      await checkoutSelf();
      setLeader((prev) => (prev ? { ...prev, online: false } : prev));
    } catch (error) {
      console.error('Checkout failed', error);
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Verifying session...</div>;
  }

  if (!user) return null;

  if (user.role !== 'LEADER') {
    return <div className="p-10 text-center text-red-600">Access denied — leaders only.</div>;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leader dashboard</h1>
        <div className="text-right">
          <div className="text-sm text-gray-600">Signed in as</div>
          <div className="font-medium">{user.name ?? user.email}</div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="card rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-medium">Presence</h2>
            <p className="mb-2">
              Leader ID: <span className="font-mono text-sm">{leader?.id ?? '—'}</span>
            </p>
            <p className="mb-4">
              Online: <strong>{leader?.online ? 'Yes' : 'No'}</strong>
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCheckin}
                disabled={checking || leader?.online || loadingLeader}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {checking ? 'Checking in…' : 'Check in'}
              </button>

              <button
                onClick={handleCheckout}
                disabled={checking || !leader?.online || loadingLeader}
                className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-50"
              >
                {checking ? 'Checking out…' : 'Check out'}
              </button>
            </div>
          </div>

          <div className="mt-4">
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