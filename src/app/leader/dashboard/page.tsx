// app/leader/dashboard/page.tsx
'use client';
import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getMyLeader, scan } from '../../../lib/api';

export default function LeaderDashboard() {
  const { user, loading } = useAuth();
  const [leader, setLeader] = useState<import('../../../types').Leader | null>(null);
  const [checkingIn, setCheckingIn] = useState<boolean>(false);

  React.useEffect(() => {
    (async () => {
      try {
        const l = await getMyLeader();
        setLeader(l);
      } catch {
        setLeader(null);
      }
    })();
  }, []);

  async function checkin() {
    setCheckingIn(true);
    try {
      // call presence checkin endpoint:
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/api'}/leader/${leader?.id}/checkin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('encounter_token') ?? ''}`, Accept: 'application/json' },
      });
      setLeader((s) => s ? { ...s, online: true } : s);
    } finally {
      setCheckingIn(false);
    }
  }

  async function checkout() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/api'}/leader/${leader?.id}/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('encounter_token') ?? ''}`, Accept: 'application/json' },
      });
      setLeader((s) => s ? { ...s, online: false } : s);
    } catch {}
  }

  if (loading) return <div>Loading auth…</div>;
  if (!user) return <div>Please login.</div>;
  if (user.role !== 'LEADER') return <div>Access denied — leaders only.</div>;

  return (
    <main style={{ padding: 24 }}>
      <h1>Leader dashboard</h1>
      <div>
        <p>Welcome, {user.name}</p>
        <p>Leader id: {leader?.id ?? '—'}</p>
        <p>Online: {leader?.online ? 'yes' : 'no'}</p>
        <div style={{ marginTop: 12 }}>
          <button onClick={checkin} disabled={checkingIn}>Check in</button>
          <button onClick={checkout} style={{ marginLeft: 8 }}>Check out</button>
        </div>
      </div>
    </main>
  );
}
