"use client";

import Link from "next/link";
import { useMemo } from "react";
import { buttonClassName } from "@/components/Button";
import { ListingCard } from "@/components/ListingCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthProvider";
import { useListings } from "@/hooks/useListings";

export default function ProfileListingsPage() {
  const { user } = useAuth();
  const { rows, loading, error } = useListings(100, 0);
  const mine = useMemo(() => rows.filter((listing) => listing.owner_id === user?.id), [rows, user?.id]);

  return (
    <ProtectedRoute>
      <main className="page-wrap py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="section-title mt-3">My Listings</h1>
          </div>
          <Link href="/listings/new" className={buttonClassName()}>
            Create New Listing
          </Link>
        </div>

        {error && <Toast kind="error" message={error} />}
        {loading ? (
          <div className="panel p-10 text-sm text-slate-600">Loading your listings…</div>
        ) : mine.length === 0 ? (
          <div className="panel p-10 text-sm text-slate-600">You haven&apos;t published a listing yet.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
