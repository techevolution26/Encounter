'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../Components/AuthProvider';
import type { Leader, EventItem } from '../../../types';
import { getMyLeader, updateMyLeader, listMyEvents, createMyEvent, checkinSelf, checkoutSelf } from '../../../lib/api';

import LeaderProfile from '../../../Components/LeaderProfile';
import LeaderEvents from '../../../Components/LeaderEvents';

export default function LeaderDashboardPage() {
  const { user, loading } = useAuth();
  const [leader, setLeader] = useState<Leader | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);

  useEffect(() => {
    if (loading || !user || user.role !== 'LEADER') return;
    let cancelled = false;

    async function initDashboard() {
      setLoadingData(true);
      try {
        const [leaderData, eventsData] = await Promise.all([getMyLeader(), listMyEvents()]);
        if (!cancelled) {
          setLeader(leaderData);
          setEvents(eventsData);
        }
      } catch (err) {
        console.error("Load failed", err);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }
    initDashboard();
    return () => { cancelled = true; };
  }, [user, loading]);

  // --- HANDLER FUNCTIONS (Restored) ---

  async function handleCheckin(event: React.MouseEvent) {
    event.preventDefault();
    setChecking(true);
    try {
      await checkinSelf();
      const updated = await getMyLeader();
      setLeader(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  }

  async function handleCheckout(event: React.MouseEvent) {
    event.preventDefault();
    setChecking(true);
    try {
      await checkoutSelf();
      const updated = await getMyLeader();
      setLeader(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  }

  async function handleProfileSave(updatedData: any) {
    setLoadingData(true);
    try {
      await updateMyLeader(updatedData);
      const refreshed = await getMyLeader();
      setLeader(refreshed);
    } finally {
      setLoadingData(false);
    }
  }

  async function handleCreateEvent(payload: any) {
    setLoadingData(true);
    try {
      await createMyEvent(payload);
      const refreshed = await listMyEvents();
      setEvents(refreshed);
    } finally {
      setLoadingData(false);
    }
  }

  // --- RENDER LOGIC ---

  if (loading) return <div className="p-10 text-center text-gray-500">Loading session...</div>;
  if (!user) return null;

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
                disabled={checking || leader?.online || loadingData}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {checking ? 'Checking in…' : 'Check in'}
              </button>
              <button
                onClick={handleCheckout}
                disabled={!leader?.online || checking || loadingData}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Check out
              </button>
            </div>
          </div>

          <div className="mt-4">
            <LeaderProfile leader={leader} loading={loadingData} onSave={handleProfileSave} />
          </div>
        </div>

        <div>
          <LeaderEvents events={events} loading={loadingData} onCreate={handleCreateEvent} />
        </div>
      </section>
    </main>
  );
}
