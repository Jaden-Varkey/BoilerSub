"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Toast } from "@/components/Toast";
import { useListings } from "@/hooks/useListings";

const listingImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBpAqjzYoW6JBV5yjgYfOhQ62pV2ml7E-e7et6z8mlznGZJS1_vAw0mMrHGI0SuNuBHSyPKhAGPVgk7uZ-2xLbw591ELSf7KsBffSgnXRtv76gu-fjWXkS9nL5I-lUC11j7Z-rzNn6dxNSp1uHI1N5s999Exn8skOP-OWnD_zSSOJGje08X3rUhQlgtwOl5d7mAMs2P9-aPG7CcQ9QiTLyf2w8CS2hpeSn-56KAuWAPR8kwr4gVQ-6RKCbRJcugWtmlUHdx4DsFqZwp",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuASik-WE3fz7hdywsQGKR4TzEdzrSOnUq5AvdPxKOwb0WRja6z1tF4phzUJWMWmaH2D-k-H7ojcSZ6kkIEXPm-DNzTItX9zCiQQTfDMP-y97wQ0dRfeAK3HDzHGWn45lzWL9LAESSKNjy9zlVkqK_0u3iIGmgUwWRuCXzEeMOnYLotoGMA_g0HJj05CTfHDN4tBva9cGQZNVoD8yHhbNCEb8aEUWFNsEf7f3Vi5dubg3m_ND933us1GL5OGHfKC6t9hrs4xF-xxYQP6",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD8dFGd9MefqXelmIHMh580k1T5pM-7linaGVsMZMmlkk0LZTw8185-OiTCDeKznm0cNFr5w9waFW3NM2tmojdWNTdjVJ7xOszHbY_lHTJgaJiaxVWW_Vzk-NhD2520ri-Atk__tDx80xbdoYVBu6j0lQ8OfFeAjartNlFc8Vr4ZzMCaycER6p9ZDr1MBLN27aRdESl8uL5D2A_C5GcmnEy-I8xwh_hXuxovhr-gu9iXzhAZlj4fIsnhW_7-uthNtgqkW4pVzRirHf5",
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(price);
}

function formatTerm(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Flexible term";
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleString("en-US", { month: "short", year: "numeric" });
  const endLabel = end.toLocaleString("en-US", { month: sameYear ? "short" : "short", year: "numeric" });
  return `${startLabel} - ${endLabel}`;
}

export default function ListingsPage() {
  const limit = 20;
  const [offset, setOffset] = useState(0);
  const { rows, loading, error } = useListings(limit, offset);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f9f6f5] text-[#2f2f2e]">
      <main className="flex h-screen flex-grow overflow-hidden pt-20">
        <div className="scrollbar-hide w-full overflow-y-auto px-6 py-8 lg:w-[60%]">
          <header className="mb-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h1 className="mb-1 text-4xl font-extrabold tracking-tighter text-[#2f2f2e] md:text-5xl">Available Subleases</h1>
                <p className="text-lg font-medium text-[#5c5b5b]">Curated, trusted, Purdue-only marketplace.</p>
              </div>
            </div>
          </header>

          <section className="mb-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-[#dfdcdc] px-3 py-1.5">
              <span className="text-sm">☰</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Filters</span>
            </div>
            <div className="scrollbar-hide flex gap-2 overflow-x-auto">
              <button className="whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#2f2f2e] shadow-[0px_12px_32px_rgba(0,0,0,0.06)] transition-colors hover:bg-[#c3d0ff]">
                Quiet Study
              </button>
              <button className="whitespace-nowrap rounded-full bg-[#0052d0] px-4 py-1.5 text-xs font-semibold text-[#f1f2ff] shadow-[0px_12px_32px_rgba(0,0,0,0.06)]">
                Near Campus
              </button>
              <button className="whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#2f2f2e] shadow-[0px_12px_32px_rgba(0,0,0,0.06)] transition-colors hover:bg-[#c3d0ff]">
                Gym Access
              </button>
              <button className="whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#2f2f2e] shadow-[0px_12px_32px_rgba(0,0,0,0.06)] transition-colors hover:bg-[#c3d0ff]">
                Pet Friendly
              </button>
            </div>
          </section>

          {error && <Toast kind="error" message={error} />}

          {loading ? (
            <div className="rounded-[1.5rem] bg-white p-10 text-sm text-[#5c5b5b] shadow-[0px_12px_32px_rgba(0,0,0,0.06)]">
              Loading listings…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-[1.5rem] bg-white p-10 text-sm text-[#5c5b5b] shadow-[0px_12px_32px_rgba(0,0,0,0.06)]">
              No listings yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {rows.map((listing, index) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group overflow-hidden rounded-[1.5rem] bg-white shadow-[0px_12px_32px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      alt={listing.title}
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw"
                      src={listingImages[index % listingImages.length]}
                    />
                    {index === 0 ? (
                      <div className="absolute left-4 top-4 flex gap-2">
                        <span className="flex items-center gap-1 rounded-full bg-[#ff946e] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#5c1a00]">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-[#a03a0f]" />
                          Available Now
                        </span>
                      </div>
                    ) : null}
                    <div className="absolute bottom-4 left-4">
                      <span className="rounded-lg bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#0052d0] backdrop-blur-md">
                        3D View
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <h3 className="text-xl font-bold leading-tight tracking-tight text-[#2f2f2e] transition-colors group-hover:text-[#0052d0]">
                        {listing.title}
                      </h3>
                      <div className="text-right">
                        <span className="block text-2xl font-black leading-none text-[#6a5a32]">${formatPrice(listing.price)}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#5c5b5b]">/ month</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-[#5c5b5b]">
                        <div className="flex items-center gap-1">
                          <span className="text-base">📅</span>
                          <span className="text-xs font-medium">{formatTerm(listing.start_date, listing.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-base">{listing.bedrooms && listing.bedrooms > 1 ? "👥" : "🛏"}</span>
                          <span className="text-xs font-medium">
                            {listing.bedrooms ?? "?"} Bed / {listing.bathrooms ?? "?"} Bath
                          </span>
                        </div>
                      </div>
                      {listing.address ? (
                        <div className="flex items-center gap-1 text-[#5c5b5b]/80">
                          <span className="text-base">📍</span>
                          <span className="text-xs">{listing.address}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}

              <article className="group relative flex flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[#0052d0]/30 bg-[#c3d0ff] p-6 text-center">
                <span className="mb-3 text-5xl text-[#0052d0] transition-transform group-hover:scale-110">🏠</span>
                <h3 className="mb-1 text-lg font-extrabold text-[#0040a5]">Have a place to list?</h3>
                <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-[#0040a5]/70">
                  Join verified Boilermakers
                </p>
                <Link
                  className="rounded-xl bg-[#0052d0] px-6 py-2.5 text-sm font-bold text-[#f1f2ff] shadow-lg transition-all hover:bg-[#0047b7]"
                  href="/listings/new"
                >
                  Start Listing
                </Link>
              </article>
            </div>
          )}

          <nav className="mt-12 flex items-center justify-center gap-2 pb-12">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f0ef] text-[#5c5b5b] disabled:opacity-50"
              disabled={offset === 0}
              onClick={() => setOffset((value) => Math.max(0, value - limit))}
            >
              ‹
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0052d0] text-sm font-bold text-[#f1f2ff]">
              {Math.floor(offset / limit) + 1}
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#5c5b5b] disabled:opacity-50"
              disabled={rows.length < limit}
              onClick={() => setOffset((value) => value + limit)}
            >
              ›
            </button>
          </nav>
        </div>

        <div className="relative hidden border-l border-[#afadac] bg-gray-200 lg:block lg:w-[40%]">
          <div className="absolute inset-0 overflow-hidden bg-[#e5e7eb]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,82,208,0.12),transparent_20%),radial-gradient(circle_at_80%_30%,rgba(160,58,15,0.10),transparent_18%),linear-gradient(135deg,#eef1f4,#dde3e9)]" />
            <div className="absolute left-[60%] top-[45%]">
              <button className="rounded-full border-2 border-white bg-[#6a5a32] px-4 py-2 text-sm font-bold text-[#fff1d9] shadow-xl">
                $850
              </button>
            </div>
            <div className="absolute left-[35%] top-[55%]">
              <button className="rounded-full border-2 border-white bg-[#0052d0] px-4 py-2 text-sm font-bold text-[#f1f2ff] shadow-xl">
                $1,100
              </button>
            </div>
            <div className="absolute left-[50%] top-[30%]">
              <button className="rounded-full border-2 border-white bg-[#0052d0] px-4 py-2 text-sm font-bold text-[#f1f2ff] shadow-xl">
                $650
              </button>
            </div>
            <div className="absolute left-[75%] top-[38%]">
              <button className="rounded-full border-2 border-white bg-[#0052d0] px-4 py-2 text-sm font-bold text-[#f1f2ff] shadow-xl">
                $1,450
              </button>
            </div>
            <div className="absolute right-6 top-6 flex flex-col gap-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                <button className="border-b border-gray-200 p-3 hover:bg-gray-100">+</button>
                <button className="p-3 hover:bg-gray-100">−</button>
              </div>
              <button className="rounded-xl border border-[#afadac] bg-white p-3 shadow-lg hover:bg-gray-100">◎</button>
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-full border border-[#0052d0]/20 bg-white/90 px-4 py-2 shadow-lg backdrop-blur-md">
                <span className="text-lg text-[#0052d0]">⌖</span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#2f2f2e]">West Lafayette Campus</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="z-50 flex h-16 w-full shrink-0 items-center justify-between border-t border-[#afadac] bg-[#f9f6f5] px-8">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-[#6a5a32]">BoilerSub</span>
          <span className="text-[10px] text-gray-400">© 2024</span>
        </div>
        <div className="flex items-center gap-6">
          <a className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#0052d0]" href="#">
            Support
          </a>
          <a className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#0052d0]" href="#">
            Terms
          </a>
          <div className="flex items-center gap-1 rounded-full bg-[#eae7e7] px-3 py-1">
            <span className="text-xs text-[#6a5a32]">✓</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter text-[#6a5a32]">Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
