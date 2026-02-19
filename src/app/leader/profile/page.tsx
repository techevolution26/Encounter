// app/leader/profile/page.tsx
'use client';
import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import LeaderProfileForm from '../../../Components/LeaderProfileForm';

export default function LeaderProfilePage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading…</div>;
  if (!user) return <div>Please login.</div>;
  if (user.role !== 'LEADER') return <div>Access denied — leaders only.</div>;

  return (
    <main style={{ padding: 24 }}>
      <h1>My leader profile</h1>
      <LeaderProfileForm />
    </main>
  );
}
