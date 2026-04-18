"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toast } from "@/components/Toast";
import { VerificationBadge } from "@/components/VerificationBadge";
import { apiClient } from "@/lib/apiClient";
import { filterRenderableImages } from "@/lib/listingMedia";
import type { Listing, PublicUser } from "@/lib/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDateRange(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  if (!endDate) {
    if (Number.isNaN(start.getTime())) {
      return "Flexible term";
    }
    return `From ${start.toLocaleString("en-US", { month: "short", year: "numeric" })}`;
  }

  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Flexible term";
  }

  return `${start.toLocaleString("en-US", { month: "short", year: "numeric" })} - ${end.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

function getPrimaryImage(images: string[]) {
  return filterRenderableImages(images)[0] ?? null;
}

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
      <main className="page-wrap pb-24 pt-12">
        {message ? <Toast kind="error" message={message} /> : null}

        <section className="mb-20 grid items-start gap-12 lg:grid-cols-[320px_1fr]">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="relative mb-6">
              <div className="h-48 w-48 rounded-full bg-gradient-to-tr from-[#6a5a32] to-[#0052d0] p-1">
                <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-[#f9f6f5] bg-white text-6xl font-black text-[#6a5a32] shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
                  {(user?.full_name?.trim()?.[0] ?? user?.email[0] ?? "P").toUpperCase()}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-full border border-[#f9f6f5] bg-[#fee6b2] px-3 py-1 text-xs font-bold text-[#64532c] shadow-md">
                Verified Student
              </div>
            </div>

            <div className="w-full rounded-xl bg-[#f3f0ef] p-6">
              <div className="flex flex-col gap-3 text-sm text-[#5c5b5b]">
                <div>Member since {new Date(user?.created_at ?? Date.now()).getFullYear()}</div>
                <div>{String(userListings.length).padStart(2, "0")} Active Listings</div>
                <div className="text-[#6a5a32]">Verified BoilerSub Member</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-5xl font-black tracking-tighter text-[#2f2f2e] md:text-6xl">
                  {user?.full_name ?? user?.email ?? "Loading..."}
                </h1>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.22em] text-[#6a5a32]">Public Profile</p>
              </div>
              <div className="flex items-center gap-3">
                {user ? <VerificationBadge verified={user.fully_verified} /> : null}
                <Link className="rounded-lg bg-[#0052d0] px-6 py-3 text-sm font-bold text-[#f1f2ff]" href="/listings">
                  Back to Browse
                </Link>
              </div>
            </div>
            <p className="max-w-3xl text-xl leading-relaxed text-[#5c5b5b]">{user?.bio ?? "No bio added yet."}</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#eae7e7] px-4 py-2 text-xs font-bold text-[#5c5b5b]">Purdue Student</span>
              <span className="rounded-full bg-[#eae7e7] px-4 py-2 text-xs font-bold text-[#5c5b5b]">Housing Host</span>
              <span className="rounded-full bg-[#eae7e7] px-4 py-2 text-xs font-bold text-[#5c5b5b]">{user?.email}</span>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <div className="mb-10 flex items-baseline justify-between">
            <h2 className="text-4xl font-black tracking-tight text-[#2f2f2e]">Listings by {user?.full_name?.split(" ")[0] ?? "Owner"}</h2>
            <div className="mx-8 hidden h-[2px] flex-grow bg-[#eae7e7] md:block" />
          </div>

          {userListings.length === 0 ? (
            <div className="rounded-2xl border border-[#dfdcdc] bg-white/80 p-10 text-sm text-[#5c5b5b]">No active listings.</div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {userListings.map((listing) => {
                const primaryImage = getPrimaryImage(listing.images);
                return (
                  <article
                    key={listing.id}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <Link className="relative h-64 overflow-hidden" href={`/listings/${listing.id}`}>
                      {primaryImage ? (
                        <Image
                          alt={listing.title}
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          fill
                          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                          src={primaryImage}
                          unoptimized={primaryImage.startsWith("data:image/")}
                        />
                      ) : (
                        <div className="h-full w-full bg-[linear-gradient(140deg,#dfe8ff_0%,#fef2d2_52%,#ffd8cb_100%)]" />
                      )}
                    </Link>

                    <div className="flex flex-1 flex-col gap-4 p-6">
                      <div>
                        <Link href={`/listings/${listing.id}`}>
                          <h3 className="text-xl font-bold text-[#2f2f2e] transition-colors group-hover:text-[#0052d0]">{listing.title}</h3>
                        </Link>
                        <p className="text-sm text-[#5c5b5b]">{listing.address ?? "West Lafayette"}</p>
                      </div>
                      <div className="text-xs text-[#5c5b5b]">{formatDateRange(listing.start_date, listing.end_date)}</div>
                      <div className="mt-2 flex items-end justify-between">
                        <p className="text-3xl font-black tracking-tighter text-[#2f2f2e]">
                          {formatPrice(listing.price)}
                          <span className="ml-1 text-sm font-normal tracking-normal text-[#5c5b5b]">/mo</span>
                        </p>
                        <Link
                          className="rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0052d0] transition-colors hover:bg-[#0052d0]/10"
                          href={`/listings/${listing.id}`}
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-24 rounded-[2rem] border border-[#afadac]/30 bg-[#f3f0ef] p-10">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h3 className="text-3xl font-black tracking-tight text-[#2f2f2e]">Trusted Purdue sublease profile.</h3>
              <p className="mt-3 text-[#5c5b5b]">
                BoilerSub only displays verified users to help students browse with stronger context and safer communication.
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-[#6a5a32]">{userListings.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5c5b5b]">Listings Published</p>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
