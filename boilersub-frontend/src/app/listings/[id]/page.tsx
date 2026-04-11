"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Toast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";
import { filterRenderableImages } from "@/lib/listingMedia";
import { useAuth } from "@/context/AuthProvider";
import type { Listing, PublicUser } from "@/lib/types";

const listingDetailImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCo1LIEamkF9_4ioE-61tfHcFvJkBuPc_Sa4j6J9fSad5lEtKxpFsp15WaVnjZxdIWqrvAZM4nvPJnu1F9n3f-QL31rDb2sZrd27tFWuBVVcO-rfWFb7KY5nTqYOziYMbehzmqpHOSQCSUn5Kmwc93K0dcykQvB6IhdluDCXK8tWfMjGCeDBek8u-05EXje2bvPUWuSTc7m9hLXCcpgI3sivyPRB6Zz5ASUGJMCmFlVFPyOqMiP3N3cmgZAI-nh-QCbcxNCU70yTcQD",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCu7DqIapAfnMtfbME8zmkOnUeyPNZrYX_imDgXdQ0xJrJ_MGRLDKSz6Kd_VgAKmXrW3uHrWKpEk-745YKItTr5je2wCNscl-QO8gJhB-C3_zWDGSoErvJvXGDdaHAyOX4h4zmmP9OI-aX00O50kTiMlLGLogoVKpJY9BAVAD8GMZZRGlUyxikZexQoGagYYyFcZyjJULxJxZpHuOyzj7zzBg6xOQApVei0MYeA4OpS0KIlvpI7BtXbnEbm9mbbn51h9RCYaJb5ypx2",
];

function galleryImages(images: string[]) {
  const renderableImages = filterRenderableImages(images);
  return renderableImages.length ? renderableImages : listingDetailImages;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDateRange(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  if (!endDate) {
    if (Number.isNaN(start.getTime())) {
      return "Flexible dates";
    }
    const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `From ${formatter.format(start)}`;
  }
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Flexible dates";
  }

  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${formatter.format(start)} — ${formatter.format(end)}`;
}

function formatTermLabel(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  if (!endDate) {
    if (Number.isNaN(start.getTime())) {
      return "Open Term";
    }
    return `${start.toLocaleString("en-US", { month: "short", year: "numeric" })} onward`;
  }
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Open Term";
  }

  return `${start.toLocaleString("en-US", { month: "short", year: "numeric" })} - ${end.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

function formatDistance(distance: number | null) {
  if (distance == null) {
    return "Distance not listed";
  }

  return `${distance.toFixed(distance % 1 === 0 ? 0 : 1)} miles from campus`;
}

function ownerSummary(owner: PublicUser | null) {
  if (!owner) {
    return "Verified Purdue student";
  }

  const name = owner.full_name?.trim();
  if (name) {
    return `${name} is part of the Purdue-only marketplace.`;
  }

  return `${owner.email} is part of the Purdue-only marketplace.`;
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [owner, setOwner] = useState<PublicUser | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const nextListing = await apiClient.listings.getById(params.id);
        setListing(nextListing);
        setOwner(await apiClient.users.getById(nextListing.owner_id));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load listing");
      }
    }

    void load();
  }, [params.id]);

  const isOwner = Boolean(user && listing && user.id === listing.owner_id);
  const images = listing ? galleryImages(listing.images) : listingDetailImages;

  return (
    <>
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        {message ? <Toast kind="error" message={message} /> : null}

        {!listing ? (
          <div className="rounded-2xl bg-[#f3f0ef] p-10 text-sm text-[#5c5b5b]">Loading listing…</div>
        ) : (
          <>
            <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[#ff946e] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#5c1a00]">
                    <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-[#5c1a00]" />
                    Available Now
                  </span>
                  <span className="text-sm font-medium tracking-wide text-[#5c5b5b]">Verified Purdue-only marketplace</span>
                </div>
                <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-[#2f2f2e] md:text-7xl">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-2 font-medium text-[#5c5b5b]">
                  <span>📍</span>
                  <span className="text-lg">{listing.address || "West Lafayette, IN"}</span>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end">
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#5c5b5b]">Monthly Rate</span>
                <div className="text-6xl font-black tracking-tighter text-[#0052d0] md:text-8xl">
                  ${formatPrice(listing.price)}
                  <span className="text-2xl font-medium tracking-normal text-[#5c5b5b]">/mo</span>
                </div>
              </div>
            </header>

            <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.06)] md:col-span-8">
                <Image
                  alt={listing.title}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  fill
                  priority
                  sizes="(min-width: 768px) 66vw, 100vw"
                  src={images[0]}
                  unoptimized={Boolean(listing.images[0])}
                />
                <div className="absolute bottom-6 left-6 flex gap-2">
                  <button className="flex items-center gap-2 rounded-lg bg-[#f9f6f5]/90 px-4 py-2 text-sm font-bold backdrop-blur-md transition-all hover:bg-[#f9f6f5]">
                    <span>🖼</span>
                    {images.length} Photo{images.length === 1 ? "" : "s"}
                  </button>

                </div>
              </div>

              <div className="flex flex-col gap-6 md:col-span-4">
                <div className="rounded-2xl bg-[#f3f0ef] p-8">
                  <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-[#5c5b5b]">Lease Details</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#0052d0]">📅</div>
                      <div>
                        <p className="font-bold text-[#2f2f2e]">{formatTermLabel(listing.start_date, listing.end_date)}</p>
                        <p className="text-sm text-[#5c5b5b]">{formatDateRange(listing.start_date, listing.end_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#0052d0]">🛏</div>
                      <div>
                        <p className="font-bold text-[#2f2f2e]">
                          {listing.bedrooms ?? "?"} Bed / {listing.bathrooms ?? "?"} Bath
                        </p>
                        <p className="text-sm text-[#5c5b5b]">Private unit</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#0052d0]">🏢</div>
                      <div>
                        <p className="font-bold text-[#2f2f2e]">{listing.address || "West Lafayette Listing"}</p>
                        <p className="text-sm text-[#5c5b5b]">Purdue sublease posting</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#0052d0]">📏</div>
                      <div>
                        <p className="font-bold text-[#2f2f2e]">{formatDistance(listing.distance)}</p>
                        <p className="text-sm text-[#5c5b5b]">Measured in miles</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-[#c3d0ff]">
                      <Image
                        alt={owner?.full_name || owner?.email || "Listing owner"}
                        className="object-cover"
                        fill
                        sizes="56px"
                        src={listingDetailImages[1]}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#2f2f2e]">{owner?.full_name ?? owner?.email ?? "Loading…"}</h4>
                        {owner?.fully_verified ? <span className="text-sm text-blue-500">✓</span> : null}
                      </div>
                      <p className="text-xs font-bold uppercase tracking-tight text-[#0052d0]">Verified Purdue Student</p>
                    </div>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-[#5c5b5b]">{owner?.bio ?? ownerSummary(owner)}</p>
                  {owner ? (
                    <Link className="flex items-center gap-1 text-sm font-bold text-[#6a5a32] hover:underline" href={`/users/${owner.id}`}>
                      View {owner.full_name?.split(" ")[0] ?? "Owner"}&apos;s Listings
                      <span>→</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
              <div className="md:col-span-8">
                <section className="mb-12">
                  <h2 className="mb-6 text-3xl font-extrabold">About this Space</h2>
                  <div className="max-w-none text-lg leading-loose text-[#5c5b5b]">
                    <p className="mb-4">{listing.description ?? "No description provided for this space yet."}</p>
                    <p>
                      This listing is part of the Purdue-only BoilerSub marketplace and is visible to verified students looking for a
                      clean handoff into their next semester housing setup.
                    </p>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="mb-8 text-3xl font-extrabold">Amenities</h2>
                  <div className="flex flex-wrap gap-3">
                    {(listing.amenities.length ? listing.amenities : ["WiFi", "Parking", "Furnished"]).map((amenity) => (
                      <div key={amenity} className="flex items-center gap-3 rounded-xl bg-[#eae7e7] p-4 pr-6">
                        <span className="text-[#0052d0]">✓</span>
                        <span className="text-sm font-bold">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="md:col-span-4">
                <div className="sticky top-32 space-y-8">
                  <div className="rounded-2xl border border-white/20 bg-[#dfdcdc] p-8 shadow-xl">
                    <h3 className="mb-6 text-xl font-extrabold">Ready to move in?</h3>
                    <button className="w-full rounded-xl bg-gradient-to-br from-[#0052d0] to-[#0047b7] py-4 text-lg font-bold text-white shadow-lg shadow-[#0052d0]/20 transition-all hover:scale-[1.02] active:scale-95">
                      Contact Lister
                    </button>
                    <p className="mt-4 text-center text-xs font-medium text-[#5c5b5b]">Average response time: &lt; 2 hours</p>

                    {isOwner ? (
                      <div className="mt-8 border-t border-[#afadac]/30 pt-8">
                        <div className="flex items-center justify-between">
                          <Link
                            className="flex items-center gap-2 text-sm font-bold text-[#5c5b5b] transition-colors hover:text-[#0052d0]"
                            href={`/listings/${listing.id}/edit`}
                          >
                            <span>✎</span>
                            Edit Listing
                          </Link>
                          <button
                            className="flex items-center gap-2 text-sm font-bold text-[#b02500] transition-colors hover:text-[#b92902]"
                            onClick={() => setConfirmOpen(true)}
                          >
                            <span>🗑</span>
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-[#fee6b2]/50 bg-[#fee6b2]/30 p-6">
                    <div className="flex items-start gap-4">
                      <span className="text-[#6a5a32]">🛡</span>
                      <div>
                        <h4 className="mb-1 font-bold text-[#64532c]">BoilerGuard Protection</h4>
                        <p className="text-sm leading-relaxed text-[#6e5d35]">
                          All listers must verify their @purdue.edu email address. Never pay before seeing the unit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Modal
        body="This action removes the listing from your dashboard and the browse grid."
        confirmLabel="Delete"
        open={confirmOpen}
        title="Delete listing?"
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!listing) {
            return;
          }
          await apiClient.listings.delete(listing.id);
          router.push("/listings");
        }}
      />
    </>
  );
}
