// components/Header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useState } from 'react';

export default function Header() {
    const { user, loading, logout } = useAuth();
    const [open, setOpen] = useState<boolean>(false);

    return (
        <header className="w-full border-b bg-white">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xl font-semibold">Encounter</Link>
                    {/* <nav className="hidden sm:flex gap-3">
                        <Link href="/who" className="text-sm text-gray-600 hover:text-gray-900">Who</Link>
                        <Link href="/events" className="text-sm text-gray-600 hover:text-gray-900">Events</Link>
                    </nav> */}
                </div>

                <div className="flex items-center gap-3">
                    {!loading && user ? (
                        <div className="relative">
                            <button
                                onClick={() => setOpen((v) => !v)}
                                className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100"
                                aria-expanded={open}
                            >
                                <span className="text-sm font-medium">{user.name ?? user.email}</span>
                                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {open && (
                                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow z-20">
                                    <div className="py-1">
                                        <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                                        <Link href="/events" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Events</Link>
                                        <Link href="/who" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Who</Link>
                                        <button
                                            onClick={async () => { setOpen(false); await logout(); }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Login</Link>
                            <Link href="/auth/register" className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
