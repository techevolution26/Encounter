'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { user, loading } = useAuth();

  const [leader, setLeader] = useState<Leader | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingLeader, setLoadingLeader] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLeader = useMemo(() => user?.role === 'LEADER', [user]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth/login?returnUrl=%2Fleader%2Fdashboard');
      return;
    }

    if (user.role !== 'LEADER') {
      router.replace('/');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user || !isLeader) return;

    let cancelled = false;

    async function loadDashboardData() {
      setError(null);
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
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load dashboard data', err);
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        }
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
  }, [loading, user, isLeader]);

  async function handleProfileSave(payload: UpdateLeaderPayload) {
    try {
      const res = await updateMyLeader(payload);
      setLeader(res.leader);
    } catch (err) {
      console.error('Failed to save leader profile', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  }

  async function handleCreateEvent(payload: CreateLeaderEventPayload) {
    try {
      const res = await createMyEvent(payload);
      setEvents((prev) => [res.event, ...prev]);
    } catch (err) {
      console.error('Failed to create event', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    }
  }

  async function handleCheckin() {
    try {
      setChecking(true);
      await checkinSelf();
      setLeader((prev) => (prev ? { ...prev, online: true } : prev));
    } catch (err) {
      console.error('Checkin failed', err);
      setError(err instanceof Error ? err.message : 'Checkin failed');
    } finally {
      setChecking(false);
    }
  }

  async function handleCheckout() {
    try {
      setChecking(true);
      await checkoutSelf();
      setLeader((prev) => (prev ? { ...prev, online: false } : prev));
    } catch (err) {
      console.error('Checkout failed', err);
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-[var(--muted)]">Verifying session...</div>;
  }

  if (!user || !isLeader) {
    return null;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Leader dashboard</h1>
        <div className="text-right">
          <div className="text-sm text-[var(--muted)]">Signed in as</div>
          <div className="font-medium text-foreground">{user.name ?? user.email}</div>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="card rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-medium text-foreground">Presence</h2>
            <p className="mb-2 text-foreground">
              Leader ID: <span className="font-mono text-sm">{leader?.id ?? '—'}</span>
            </p>
            <p className="mb-4 text-foreground">
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
            <LeaderProfile
              leader={leader}
              loading={loadingLeader}
              onSave={handleProfileSave}
            />
          </div>
        </div>

        <div>
          <LeaderEvents
            events={events}
            loading={loadingEvents}
            onCreate={handleCreateEvent}
          />
        </div>
      </section>
    </main>
  );
}