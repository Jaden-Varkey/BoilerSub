"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { buttonClassName } from "@/components/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthProvider";
import { apiClient } from "@/lib/apiClient";
import { filterRenderableImages } from "@/lib/listingMedia";
import { useListings } from "@/hooks/useListings";

function formatDateRange(startDate: string, endDate: string | null) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
  if (!endDate) {
    return `${formatter.format(new Date(startDate))} onward`;
  }
  return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function ListingStatusBadge({ startDate, endDate }: { startDate: string; endDate: string | null }) {
  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (start > now) {
    return (
      <span className="rounded-full bg-[#ffd8cb] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#7d2600]">
        Upcoming
      </span>
    );
  }

  if (!end || end >= now) {
    return (
      <span className="rounded-full bg-[#dfe8ff] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#0040a5]">
        Active
      </span>
    );
  }

  return (
    <span className="rounded-full bg-stone-200 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-stone-700">
      Closed
    </span>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-[2rem] border border-stone-200/60 bg-white/90 p-8 text-center shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-stone-500">{label}</p>
      <p className={`mt-3 font-display text-5xl font-black tracking-[-0.06em] ${accent}`}>{value}</p>
    </div>
  );
}

export default function ProfileListingsPage() {
  const { user } = useAuth();
  const { rows, loading, error, refresh } = useListings(100, 0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mine = useMemo(() => rows.filter((listing) => listing.owner_id === user?.id), [rows, user?.id]);

  const stats = useMemo(() => {
    const now = new Date();
    const total = mine.length;
    const active = mine.filter((listing) => new Date(listing.start_date) <= now && (!listing.end_date || new Date(listing.end_date) >= now)).length;
    const averagePrice = total > 0 ? Math.round(mine.reduce((sum, listing) => sum + listing.price, 0) / total) : 0;
    const endingSoon = mine.filter((listing) => {
      if (!listing.end_date) {
        return false;
      }
      const end = new Date(listing.end_date);
      const daysRemaining = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysRemaining >= 0 && daysRemaining <= 30;
    }).length;

    return { total, active, averagePrice, endingSoon };
  }, [mine]);

  async function handleDelete(id: string, title: string) {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setActionError(null);

    try {
      await apiClient.listings.delete(id);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ProtectedRoute>
      <main className="page-wrap pb-20 pt-10">
        <section className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="mt-4 font-display text-5xl font-black tracking-[-0.07em] text-stone-900 sm:text-6xl">
              My Listings
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-stone-600">
              Manage your active subleases on BoilerSub. This dashboard mirrors the Stitch layout while staying wired to your live listings.
            </p>
          </div>
          <Link
            className={`${buttonClassName()} flex items-center gap-2 rounded-2xl px-8 py-4 text-base shadow-[0_20px_40px_rgba(0,82,208,0.2)]`}
            href="/listings/new"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              +
            </span>
            Create New Listing
          </Link>
        </section>

        {(error || actionError) && <Toast kind="error" message={actionError ?? error ?? "Something went wrong"} />}

        <section className="mb-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard accent="text-[#6a5a32]" label="Total Listings" value={String(stats.total).padStart(2, "0")} />
          <StatCard accent="text-[#0052d0]" label="Active Now" value={String(stats.active).padStart(2, "0")} />
          <StatCard accent="text-stone-900" label="Average Rent" value={stats.averagePrice > 0 ? formatCurrency(stats.averagePrice) : "$0"} />
          <StatCard accent="text-[#a03a0f]" label="Ending Soon" value={String(stats.endingSoon).padStart(2, "0")} />
        </section>

        <section className="grid gap-10 xl:grid-cols-12">
          <div className="xl:col-span-8">
            {loading ? (
              <div className="rounded-[2rem] border border-stone-200/60 bg-white/85 p-10 text-sm text-stone-600 shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
                Loading your listings...
              </div>
            ) : mine.length === 0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-stone-300 bg-white/65 p-16 text-center shadow-[0_12px_32px_rgba(0,0,0,0.03)]">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#efe7d7] text-4xl text-[#6a5a32]">
                  <span aria-hidden="true">⌂</span>
                </div>
                <h2 className="mt-6 font-display text-3xl font-black tracking-[-0.05em] text-stone-900">No listings yet?</h2>
                <p className="mx-auto mt-3 max-w-md text-stone-600">
                  Create your first sublease listing to start reaching Purdue students looking for housing right now.
                </p>
                <Link className={`${buttonClassName()} mt-8 inline-flex`} href="/listings/new">
                  Post Your Space
                </Link>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                {mine.map((listing) => (
                  <article
                    key={listing.id}
                    className="group overflow-hidden rounded-[2rem] border border-stone-200/60 bg-white/92 shadow-[0_12px_32px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(0,0,0,0.08)]"
                  >
                    <div className="relative h-52 overflow-hidden bg-[linear-gradient(135deg,#dfe8ff_0%,#fef2d2_45%,#ffd8cb_100%)]">
                      {filterRenderableImages(listing.images)[0] ? (
                        <Image
                          alt={listing.title}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          fill
                          sizes="(min-width: 768px) 50vw, 100vw"
                          src={filterRenderableImages(listing.images)[0]!}
                          unoptimized={filterRenderableImages(listing.images)[0]!.startsWith("data:image/")}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.7),transparent_30%),linear-gradient(135deg,#dfe8ff_0%,#fef2d2_45%,#ffd8cb_100%)]" />
                      )}
                      <div className="absolute right-4 top-4">
                        <ListingStatusBadge endDate={listing.end_date} startDate={listing.start_date} />
                      </div>
                    </div>

                    <div className="p-8">
                      <Link href={`/listings/${listing.id}`}>
                        <h2 className="font-display text-2xl font-black tracking-[-0.05em] text-stone-900 transition-colors group-hover:text-[#0052d0]">
                          {listing.title}
                        </h2>
                      </Link>
                      <p className="mt-1 text-sm text-stone-500">{listing.address ?? "West Lafayette, IN"}</p>

                      <div className="mt-6 flex items-end gap-2">
                        <span className="font-display text-4xl font-black tracking-[-0.05em] text-stone-900">
                          {formatCurrency(listing.price)}
                        </span>
                        <span className="pb-1 text-sm font-medium text-stone-500">/ month</span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-500">
                        <span>{formatDateRange(listing.start_date, listing.end_date)}</span>
                        {listing.bedrooms !== null && <span>{listing.bedrooms} bed</span>}
                        {listing.bathrooms !== null && <span>{listing.bathrooms} bath</span>}
                      </div>

                      {listing.description ? (
                        <p className="mt-5 line-clamp-3 text-sm leading-7 text-stone-600">{listing.description}</p>
                      ) : null}

                      <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-6">
                        <Link
                          className="rounded-xl px-4 py-2 font-display text-sm font-bold tracking-tight text-[#0052d0] transition-colors hover:bg-[#0052d0]/5"
                          href={`/listings/${listing.id}/edit`}
                        >
                          Edit
                        </Link>
                        <button
                          className="rounded-xl px-4 py-2 font-display text-sm font-bold tracking-tight text-[#a03a0f] transition-colors hover:bg-[#a03a0f]/5 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={deletingId === listing.id}
                          type="button"
                          onClick={() => void handleDelete(listing.id, listing.title)}
                        >
                          {deletingId === listing.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-8 xl:col-span-4">
            <div className="rounded-[2rem] border border-stone-200/60 bg-white/92 p-8 shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
              <h2 className="flex items-center gap-3 font-display text-2xl font-black tracking-[-0.05em] text-stone-900">
                <span className="text-[#0052d0]">◌</span>
                Performance Stats
              </h2>

              <div className="mt-8 space-y-5">
                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-500">Portfolio Filled</span>
                    <span className="font-bold text-[#0052d0]">
                      {stats.total === 0 ? "0%" : `${Math.round((stats.active / stats.total) * 100)}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-[#0052d0]"
                      style={{ width: `${stats.total === 0 ? 0 : Math.max(12, Math.round((stats.active / stats.total) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-stone-50 p-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-500">Listings With Amenities</span>
                    <span className="font-bold text-[#a03a0f]">
                      {stats.total === 0 ? "0%" : `${Math.round((mine.filter((listing) => listing.amenities.length > 0).length / stats.total) * 100)}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-[#a03a0f]"
                      style={{
                        width: `${stats.total === 0 ? 0 : Math.max(12, Math.round((mine.filter((listing) => listing.amenities.length > 0).length / stats.total) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-stone-200 pt-8">
                <div className="rounded-[1.5rem] bg-[#dfe8ff]/45 p-5 text-sm leading-7 text-[#0040a5]">
                  <p className="font-display text-sm font-black uppercase tracking-[0.24em] text-[#0052d0]">BoilerTip</p>
                  <p className="mt-2">
                    Listings with clear dates, rent, and amenities read closer to complete and are easier for students to compare quickly.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-stone-200/60 bg-[linear-gradient(135deg,#fff8ea_0%,#f3f0ef_100%)] p-8 shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-stone-500">Quick Actions</p>
              <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.05em] text-stone-900">Keep your dashboard moving.</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Add a new listing, review what is about to expire, or jump back to the marketplace to compare pricing.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link className={`${buttonClassName()} justify-center`} href="/listings/new">
                  Create Listing
                </Link>
                <Link
                  className="rounded-2xl border border-stone-300 bg-white px-6 py-3 text-center font-display text-sm font-bold text-stone-900 transition-colors hover:bg-stone-100"
                  href="/listings"
                >
                  View Marketplace
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </ProtectedRoute>
  );
}
