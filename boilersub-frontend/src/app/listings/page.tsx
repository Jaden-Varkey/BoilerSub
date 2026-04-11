"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { filterRenderableImages } from "@/lib/listingMedia";
import { Toast } from "@/components/Toast";
import { useListings } from "@/hooks/useListings";

const listingImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBpAqjzYoW6JBV5yjgYfOhQ62pV2ml7E-e7et6z8mlznGZJS1_vAw0mMrHGI0SuNuBHSyPKhAGPVgk7uZ-2xLbw591ELSf7KsBffSgnXRtv76gu-fjWXkS9nL5I-lUC11j7Z-rzNn6dxNSp1uHI1N5s999Exn8skOP-OWnD_zSSOJGje08X3rUhQlgtwOl5d7mAMs2P9-aPG7CcQ9QiTLyf2w8CS2hpeSn-56KAuWAPR8kwr4gVQ-6RKCbRJcugWtmlUHdx4DsFqZwp",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuASik-WE3fz7hdywsQGKR4TzEdzrSOnUq5AvdPxKOwb0WRja6z1tF4phzUJWMWmaH2D-k-H7ojcSZ6kkIEXPm-DNzTItX9zCiQQTfDMP-y97wQ0dRfeAK3HDzHGWn45lzWL9LAESSKNjy9zlVkqK_0u3iIGmgUwWRuCXzEeMOnYLotoGMA_g0HJj05CTfHDN4tBva9cGQZNVoD8yHhbNCEb8aEUWFNsEf7f3Vi5dubg3m_ND933us1GL5OGHfKC6t9hrs4xF-xxYQP6",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD8dFGd9MefqXelmIHMh580k1T5pM-7linaGVsMZMmlkk0LZTw8185-OiTCDeKznm0cNFr5w9waFW3NM2tmojdWNTdjVJ7xOszHbY_lHTJgaJiaxVWW_Vzk-NhD2520ri-Atk__tDx80xbdoYVBu6j0lQ8OfFeAjartNlFc8Vr4ZzMCaycER6p9ZDr1MBLN27aRdESl8uL5D2A_C5GcmnEy-I8xwh_hXuxovhr-gu9iXzhAZlj4fIsnhW_7-uthNtgqkW4pVzRirHf5",
];

function imageForListing(images: string[], index: number) {
  const renderableImages = filterRenderableImages(images);
  return renderableImages.length ? renderableImages : [listingImages[index % listingImages.length]];
}

function ListingImageCarousel({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setTransitioning(false);
  }, [images]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function startTransition(nextDirection: "next" | "prev") {
    if (images.length <= 1 || transitioning) {
      return;
    }

    setDirection(nextDirection);
    setTransitioning(true);

    timeoutRef.current = window.setTimeout(() => {
      setActiveIndex((current) =>
        nextDirection === "next" ? (current + 1) % images.length : (current - 1 + images.length) % images.length,
      );
      setTransitioning(false);
    }, 700);
  }

  useEffect(() => {
    if (paused || images.length <= 1 || transitioning) {
      return;
    }

    const timer = window.setInterval(() => {
      startTransition("next");
    }, 3000);

    return () => window.clearInterval(timer);
  }, [images.length, paused, transitioning]);

  const previousIndex = (activeIndex - 1 + images.length) % images.length;
  const nextIndex = (activeIndex + 1) % images.length;
  const trackImages = direction === "next" ? [activeIndex, nextIndex] : [previousIndex, activeIndex];
  const translate = direction === "next" ? (transitioning ? "-100%" : "0%") : transitioning ? "0%" : "-100%";

  return (
    <div
      className="relative h-56 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(${translate})` }}
      >
        {trackImages.map((imageIndex, frameIndex) => (
          <div key={`${imageIndex}-${frameIndex}`} className="relative h-full min-w-full">
            <Image
              alt={alt}
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw"
              src={images[imageIndex]}
              unoptimized={images[imageIndex].startsWith("data:image/")}
            />
          </div>
        ))}
      </div>

      {images.length > 1 ? (
        <>
          <button
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-[#2f2f2e] shadow-md backdrop-blur-sm transition hover:bg-white"
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setPaused(true);
              startTransition("prev");
            }}
          >
            ‹
          </button>
          <button
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-[#2f2f2e] shadow-md backdrop-blur-sm transition hover:bg-white"
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setPaused(true);
              startTransition("next");
            }}
          >
            ›
          </button>
        </>
      ) : null}
    </div>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(price);
}

function formatTerm(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  if (!endDate) {
    if (Number.isNaN(start.getTime())) {
      return "Flexible term";
    }
    return `${start.toLocaleString("en-US", { month: "short", year: "numeric" })} onward`;
  }
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Flexible term";
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleString("en-US", { month: "short", year: "numeric" });
  const endLabel = end.toLocaleString("en-US", { month: sameYear ? "short" : "short", year: "numeric" });
  return `${startLabel} - ${endLabel}`;
}

function openBlank3DView(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
  window.open("about:blank", "_blank", "noopener,noreferrer");
}

export default function ListingsPage() {
  const limit = 20;
  const [offset, setOffset] = useState(0);
  const { rows, loading, error } = useListings(limit, offset);

  return (
    <div className="min-h-screen bg-transparent text-[#2f2f2e]">
      <main className="mx-auto max-w-7xl px-6 py-8 pt-28">
        <div className="w-full">
          <header className="mb-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h1 className="mb-1 text-4xl font-extrabold tracking-tighter text-[#2f2f2e] md:text-5xl">Available Subleases</h1>
                <p className="text-lg font-medium text-[#5c5b5b]">Curated, trusted, Purdue-only marketplace.</p>
              </div>
            </div>
          </header>



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
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {rows.map((listing, index) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group overflow-hidden rounded-[1.5rem] bg-white shadow-[0px_12px_32px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden">
                    <ListingImageCarousel alt={listing.title} images={imageForListing(listing.images, index)} />
                    {index === 0 ? (
                      <div className="absolute left-4 top-4 flex gap-2">
                        <span className="flex items-center gap-1 rounded-full bg-[#ff946e] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#5c1a00]">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-[#a03a0f]" />
                          Available Now
                        </span>
                      </div>
                    ) : null}

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
                      {listing.owner?.full_name ? (
                        <div className="flex items-center gap-1 text-[#5c5b5b]/80">
                          <span className="text-base">👤</span>
                          <span className="text-xs font-medium">Listed by {listing.owner.full_name}</span>
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
      </main>

      <footer className="z-50 flex h-24 w-full shrink-0 items-center justify-between border-t border-[#afadac]/20 bg-transparent px-8">
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
