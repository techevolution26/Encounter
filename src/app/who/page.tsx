"use client";

import React, { useEffect, useMemo, useState } from "react";
import { followLeader, getLeaders, unfollowLeader } from "@/lib/api";
import type { Leader } from "@/types";

type LeaderWithFollow = Leader & {
  name?: string;
  followed?: boolean;
};

export default function WhoPage() {
  const [leaders, setLeaders] = useState<LeaderWithFollow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaders() {
      try {
        setLoading(true);
        setError(null);

        const list = await getLeaders();

        if (!cancelled) {
          setLeaders(
            list.map((leader) => ({
              ...leader,
              followed: Boolean((leader as LeaderWithFollow).followed),
            }))
          );
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load leaders.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLeaders();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasLeaders = useMemo(() => leaders.length > 0, [leaders]);

  async function handleFollowToggle(leader: LeaderWithFollow) {
    const nextFollowed = !leader.followed;

    try {
      setPendingId(leader.id);

      setLeaders((prev) =>
        prev.map((item) =>
          item.id === leader.id ? { ...item, followed: nextFollowed } : item
        )
      );

      if (nextFollowed) {
        await followLeader(leader.id);
      } else {
        await unfollowLeader(leader.id);
      }
    } catch (err) {
      console.error(err);

      setLeaders((prev) =>
        prev.map((item) =>
          item.id === leader.id ? { ...item, followed: leader.followed } : item
        )
      );
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Who to encounter
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Discover and follow leaders you want to hear from.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-gray-200" />
                  <div className="h-3 w-2/3 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <h1 className="text-xl font-semibold text-red-900">
          Unable to load leaders
        </h1>
        <p className="mt-2 text-sm text-red-800">{error}</p>
      </section>
    );
  }

  if (!hasLeaders) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900">No leaders yet</h1>
        <p className="mt-2 text-sm text-gray-600">
          Leaders will appear here once they are available in the system.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Who to encounter
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Follow leaders whose teachings, updates, and reflections matter to you.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {leaders.map((leader) => {
          const displayName = leader.name ?? leader.user_id ?? "Unknown leader";
          const isPending = pendingId === leader.id;

          return (
            <article
              key={leader.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <img
                  src={leader.avatar ?? "/default-avatar.png"}
                  alt={displayName}
                  className="h-14 w-14 rounded-full object-cover"
                />

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-gray-900">
                    {displayName}
                  </h2>

                  {leader.bio ? (
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-gray-600">
                      {leader.bio}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">
                      No bio available yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => void handleFollowToggle(leader)}
                  className={[
                    "w-full rounded-md px-4 py-2 text-sm font-medium transition",
                    leader.followed
                      ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      : "bg-gray-900 text-white hover:bg-gray-800",
                    isPending ? "cursor-not-allowed opacity-70" : "",
                  ].join(" ")}
                >
                  {isPending
                    ? "Updating..."
                    : leader.followed
                      ? "Unfollow"
                      : "Follow"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}