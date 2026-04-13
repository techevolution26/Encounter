"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/Components/AuthProvider";
import { useClickOutside } from "@/hooks/useClickOutside";

type NavItem = {
    href: string;
    label: string;
    protected?: boolean;
};

const NAV_ITEMS: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/who", label: "Who" },
    { href: "/events", label: "Events" },
];

function isActive(pathname: string, href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
    const pathname = usePathname();
    const { user, loading, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useClickOutside(menuRef, () => setMenuOpen(false));

    const visibleNav = useMemo(() => NAV_ITEMS, []);

    return (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-lg font-semibold tracking-tight">
                        Encounter
                    </Link>

                    <nav className="hidden items-center gap-1 md:flex">
                        {visibleNav.map((item) => {
                            const active = isActive(pathname, item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={[
                                        "rounded-md px-3 py-2 text-sm transition",
                                        active
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                    ].join(" ")}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {loading ? (
                        <div className="h-9 w-28 animate-pulse rounded-md bg-gray-200" />
                    ) : user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setMenuOpen((prev) => !prev)}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                            >
                                <span className="max-w-[160px] truncate font-medium">
                                    {user.name ?? user.email}
                                </span>
                                <svg
                                    className="h-4 w-4 text-gray-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                                    <div className="border-b border-gray-100 px-4 py-3">
                                        <p className="truncate text-sm font-medium text-gray-900">
                                            {user.name ?? "Signed in"}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                                    </div>

                                    <div className="py-1">
                                        <Link
                                            href="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Profile
                                        </Link>
                                        <Link
                                            href="/events"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Events
                                        </Link>
                                        <Link
                                            href="/who"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Who to follow
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setMenuOpen(false);
                                                await logout();
                                            }}
                                            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/auth/login"
                                className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            >
                                Login
                            </Link>
                            <Link
                                href="/auth/register"
                                className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-gray-100 md:hidden">
                <nav className="mx-auto flex w-full max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
                    {visibleNav.map((item) => {
                        const active = isActive(pathname, item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={[
                                    "whitespace-nowrap rounded-md px-3 py-2 text-sm transition",
                                    active
                                        ? "bg-gray-900 text-white"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                ].join(" ")}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}