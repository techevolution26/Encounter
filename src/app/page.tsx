"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/Components/AuthProvider";
import ScanButton from "@/Components/ScanButton";
import { scan } from "@/lib/api";
import type { ScanResponse } from "@/types";
import "./scan.css";

type ScanState = "idle" | "scanning" | "found" | "none" | "error";

type FoundMatch = {
  leaderId: string;
  sessionId: string;
};

function extractFallbackText(fallback: unknown): string {
  if (!fallback) return "No leader is online right now.";
  if (typeof fallback === "string") return fallback;

  if (typeof fallback === "object" && fallback !== null) {
    const maybeText = (fallback as { text?: unknown }).text;
    if (typeof maybeText === "string" && maybeText.trim()) {
      return maybeText;
    }
  }

  return "No leader is online right now. Please try again later.";
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [status, setStatus] = useState<ScanState>("idle");
  const [found, setFound] = useState<FoundMatch | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ctaText = useMemo(() => {
    if (loading) return "Checking account...";
    if (!user) return "Sign in to start scanning";
    if (status === "scanning") return "Scanning...";
    return "Tap to scan";
  }, [loading, user, status]);

  async function handleScan() {
    if (loading) return;

    if (!user) {
      router.push("/auth/login?returnUrl=%2F");
      return;
    }

    setStatus("scanning");
    setFound(null);
    setFallbackText(null);
    setError(null);

    try {
      const response: ScanResponse = await scan({ preferences: {} });

      if (response.status === "found" && response.match) {
        setFound({
          leaderId: response.match.leaderId,
          sessionId: response.match.sessionId,
        });
        setStatus("found");
        return;
      }

      setFallbackText(extractFallbackText(response.fallback));
      setStatus("none");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong during scan.";
      setError(message);
      setStatus("error");
    }
  }

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="mx-auto w-full max-w-2xl text-center">
        <div className="mb-8 space-y-3">
          <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
            Daily spiritual connection
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Encounter
          </h1>

          <p className="mx-auto max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            Scan to connect with a leader, discover guidance, or receive a
            meaningful fallback when no one is currently available.
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center gap-6">
            <ScanButton
              scanning={status === "scanning"}
              onClick={handleScan}
              disabled={loading || status === "scanning"}
              ariaLabel={ctaText}
            />

            <p className="text-sm text-gray-500">{ctaText}</p>

            {status === "found" && found && (
              <div className="w-full rounded-2xl border border-green-200 bg-green-50 p-5 text-left">
                <h2 className="text-lg font-semibold text-green-900">
                  Match found
                </h2>
                <div className="mt-2 space-y-1 text-sm text-green-800">
                  <p>
                    <span className="font-medium">Leader:</span> {found.leaderId}
                  </p>
                  <p>
                    <span className="font-medium">Session:</span>{" "}
                    {found.sessionId}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/leaders/${found.leaderId}`}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
                  >
                    View leader
                  </Link>
                  <Link
                    href={`/session/${found.sessionId}`}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Open session
                  </Link>
                </div>
              </div>
            )}

            {status === "none" && fallbackText && (
              <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
                <h2 className="text-lg font-semibold text-amber-900">
                  No leaders online
                </h2>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  {fallbackText}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/who"
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
                  >
                    Follow leaders
                  </Link>
                  <button
                    type="button"
                    onClick={handleScan}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {status === "error" && error && (
              <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-5 text-left">
                <h2 className="text-lg font-semibold text-red-900">
                  Scan failed
                </h2>
                <p className="mt-2 text-sm text-red-800">{error}</p>
                <button
                  type="button"
                  onClick={handleScan}
                  className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}