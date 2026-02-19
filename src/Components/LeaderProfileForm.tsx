// components/LeaderProfileForm.tsx
'use client';
import React, { useEffect, useState } from 'react';
import type { Leader } from '../types';
import { getMyLeader, updateMyLeader, requestVerification } from '../lib/api';

export default function LeaderProfileForm() {
    const [leader, setLeader] = useState<Leader | null>(null);
    const [bio, setBio] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const l = await getMyLeader();
                setLeader(l);
                setBio(l.bio ?? '');
            } catch {
                setLeader(null);
            }
        })();
    }, []);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await updateMyLeader({ bio });
            setLeader(res.leader);
            setMessage('Saved');
        } catch (err) {
            setMessage('Save failed');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 2000);
        }
    }

    async function askVerify() {
        setSaving(true);
        try {
            const res = await requestVerification({ note: 'Requesting verification' });
            setMessage('Verification requested');
        } catch {
            setMessage('Request failed');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 2000);
        }
    }

    return (
        <form onSubmit={save} style={{ maxWidth: 720 }}>
            <label>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={6} />

            <div style={{ marginTop: 12 }}>
                <button type="submit" disabled={saving}>Save profile</button>
                <button type="button" onClick={askVerify} style={{ marginLeft: 8 }} disabled={saving}>Request verification</button>
            </div>

            {message && <div style={{ marginTop: 8 }}>{message}</div>}
        </form>
    );
}
