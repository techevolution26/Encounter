'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '../Components/AuthProvider';
import ScanButton from '../Components/ScanButton';
import { scan } from '../lib/api';
import type { ScanResponse } from '../types';
import './scan.css';

type FoundMatch = { leaderId: string; sessionId: string };

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthContext(); // Access auth state

  const [status, setStatus] = useState<'idle' | 'scanning' | 'found' | 'none'>('idle');
  const [found, setFound] = useState<FoundMatch | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    // 1. Auth Guard: Redirect if not logged in
    if (!user) {
      const returnUrl = encodeURIComponent('/');
      router.push(`/auth/login?returnUrl=${returnUrl}`);
      return;
    }

    // 2. Reset UI State
    setStatus('scanning');
    setFound(null);
    setFallbackText(null);
    setError(null);

    // 3. Execution Logic
    try {
      const resp: ScanResponse = await scan({ preferences: {} });

      if (resp.status === 'found') {
        setStatus('found');
        setFound(resp.match);
      } else {
        setStatus('none');
        // Handle fallback text safely
        const text = (resp.fallback as { text?: string })?.text ?? JSON.stringify(resp.fallback);
        setFallbackText(text);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      setError(message);
      setStatus('idle');
    }
  }

  return (
    <main className="page-center">
      <div className="header">
        {/* <h1 className="title">Encounter</h1> */}
      </div>

      <div className="center-block">
        <ScanButton scanning={status === 'scanning'} onClick={handleScan} />
      </div>

      <div className="result">
        {status === 'found' && found && (
          <div className="card">
            <h3>Match found</h3>
            <p>Leader: {found.leaderId}</p>
            <p>Session: {found.sessionId}</p>
          </div>
        )}

        {status === 'none' && fallbackText && (
          <div className="card">
            <h3>No leaders online</h3>
            <p>Fallback: {fallbackText}</p>
          </div>
        )}

        {error && <div className="card error">{error}</div>}
      </div>
    </main>
  );
}
