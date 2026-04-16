"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toast } from "@/components/Toast";
import { VerificationBadge } from "@/components/VerificationBadge";
import { apiClient } from "@/lib/apiClient";
import type { Listing, PublicUser } from "@/lib/types";

export default function PublicUserPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [nextUser, allListings] = await Promise.all([
          apiClient.users.getById(params.id),
          apiClient.listings.list(100, 0),
        ]);
        setUser(nextUser);
        setListings(allListings);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load profile");
      }
    }

    void load();
  }, [params.id]);

  const userListings = useMemo(() => listings.filter((listing) => listing.owner_id === params.id), [listings, params.id]);

  return (
    <ProtectedRoute>
      <main className="page-wrap py-12">
        {message && <Toast kind="error" message={message} />}
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="panel p-8">
            <p className="eyebrow">Public profile</p>
            <h1 className="mt-3 font-display text-4xl">{user?.full_name ?? user?.email ?? "Loading…"}</h1>
            {user && <div className="mt-4"><VerificationBadge verified={user.fully_verified} /></div>}
            <p className="mt-5 text-sm leading-7 text-slate-600">{user?.bio ?? "No bio added yet."}</p>
            <p className="mt-4 text-sm text-slate-500">{user?.email}</p>
          </aside>

          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-3xl">Active listings</h2>
              <Link href="/listings" className="text-sm font-semibold text-brand-blue underline">
                Back to browse
              </Link>
            </div>
            {userListings.length === 0 ? (
              <div className="panel p-10 text-sm text-slate-600">No active listings.</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {userListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
