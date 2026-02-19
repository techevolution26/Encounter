'use client';

import React, { useEffect, useState } from 'react';
import type { Leader } from '../../types';
import { getLeaders, followLeader, unfollowLeader } from '../../lib/api';
import { normalizeAvatarUrl } from '../../utils/url';

type LeaderWithFollow = Leader & { followed: boolean; avatar?: string | null; name?: string | null };

export default function WhoPage() {
    const [leaders, setLeaders] = useState<LeaderWithFollow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        (async () => {
            try {
                const list = await getLeaders();
                // ensure avatar normalized (getLeaders already normalizes, but double-check)
                const normalized = list.map((l: Leader) => ({
                    ...l,
                    avatar: normalizeAvatarUrl(l.avatar ?? null),
                    followed: !!l.followed,
                }));
                setLeaders(normalized);
            } catch (err) {
                console.error('Failed to load leaders', err);
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
                            <img
                                src={l.avatar ?? '/default-avatar.png'}
                                alt={l.name ?? l.user_id ?? 'leader'}
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-avatar.png'; }}
                            />
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
