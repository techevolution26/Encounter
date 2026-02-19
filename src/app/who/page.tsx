// app/who/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { Leader } from '../../types';
import { getLeaders, followLeader, unfollowLeader } from '../../lib/api';

type LeaderAPI = Leader & { name?: string; followed?: boolean };
type LeaderWithFollow = LeaderAPI & { followed: boolean };

export default function WhoPage() {
  const [leaders, setLeaders] = useState<LeaderWithFollow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await getLeaders();
        const normalized = list.map((l) => ({ ...(l as LeaderAPI), followed: !!(l as LeaderAPI).followed }));
        setLeaders(normalized);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleFollow(id: string) {
    try {
      await followLeader(id);
      setLeaders((s) => s.map((l) => (l.id === id ? { ...l, followed: true } : l)));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUnfollow(id: string) {
    try {
      await unfollowLeader(id);
      setLeaders((s) => s.map((l) => (l.id === id ? { ...l, followed: false } : l)));
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="card">Loading leaders…</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Who to encounter</h2>
      <ul className="space-y-3">
        {leaders.map((l) => (
          <li key={l.id} className="flex items-center justify-between p-3 bg-white rounded shadow">
            <div className="flex items-center gap-3">
              <img src={l.avatar ?? '/default-avatar.png'} alt={l.name ?? l.user_id} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <div className="font-medium">{l.name ?? l.user_id}</div>
                <div className="text-sm text-gray-500">{l.bio ?? ''}</div>
              </div>
            </div>

            <div>
              {l.followed ? (
                <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => handleUnfollow(l.id)}>Unfollow</button>
              ) : (
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => handleFollow(l.id)}>Follow</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
