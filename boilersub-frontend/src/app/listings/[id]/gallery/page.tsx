"use client";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { filterRenderableImages } from "@/lib/listingMedia";
import type { Listing } from "@/lib/types";

const fallbackImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCo1LIEamkF9_4ioE-61tfHcFvJkBuPc_Sa4j6J9fSad5lEtKxpFsp15WaVnjZxdIWqrvAZM4nvPJnu1F9n3f-QL31rDb2sZrd27tFWuBVVcO-rfWFb7KY5nTqYOziYMbehzmqpHOSQCSUn5Kmwc93K0dcykQvB6IhdluDCXK8tWfMjGCeDBek8u-05EXje2bvPUWuSTc7m9hLXCcpgI3sivyPRB6Zz5ASUGJMCmFlVFPyOqMiP3N3cmgZAI-nh-QCbcxNCU70yTcQD",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCu7DqIapAfnMtfbME8zmkOnUeyPNZrYX_imDgXdQ0xJrJ_MGRLDKSz6Kd_VgAKmXrW3uHrWKpEk-745YKItTr5je2wCNscl-QO8gJhB-C3_zWDGSoErvJvXGDdaHAyOX4h4zmmP9OI-aX00O50kTiMlLGLogoVKpJY9BAVAD8GMZZRGlUyxikZexQoGagYYyFcZyjJULxJxZpHuOyzj7zzBg6xOQApVei0MYeA4OpS0KIlvpI7BtXbnEbm9mbbn51h9RCYaJb5ypx2",
];

function getGalleryImages(images: string[]): string[] {
  const renderable = filterRenderableImages(images);
  return renderable.length ? renderable : fallbackImages;
}

export default function ListingGalleryPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let active = true;
    void apiClient.listings
      .getById(params.id)
      .then((nextListing) => {
        if (!active) {
          return;
        }
        setListing(nextListing);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load images");
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  const images = useMemo(() => getGalleryImages(listing?.images ?? []), [listing?.images]);
  const totalImages = images.length;

  useEffect(() => {
    if (!totalImages) {
      return;
    }
    const start = Number(searchParams.get("start") ?? 0);
    if (Number.isNaN(start)) {
      setActiveIndex(0);
      return;
    }
    const normalized = Math.max(0, Math.min(start, totalImages - 1));
    setActiveIndex(normalized);
  }, [searchParams, totalImages]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % totalImages);
      } else if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current - 1 + totalImages) % totalImages);
      }
    };

    if (!totalImages) {
      return;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [totalImages]);

  const currentImage = images[activeIndex] ?? images[0] ?? fallbackImages[0];
  const listingTitle = listing?.title ?? "Apartment Gallery";

  return (
    <main className="fixed inset-0 z-[9999] bg-black text-white">
      <section className="relative h-screen w-screen overflow-hidden bg-black">
        {error ? (
          <div className="absolute left-4 top-4 z-30 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="relative h-full w-full">
          <button
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/35 bg-black/60 px-3 py-2 text-xl text-white transition hover:bg-black/80 md:left-6"
            type="button"
            onClick={() => setActiveIndex((current) => (current - 1 + totalImages) % totalImages)}
          >
            ←
          </button>

          <div className="relative h-full w-full">
            <Image
              alt={`${listingTitle} image ${activeIndex + 1}`}
              className="object-contain"
              fill
              priority
              sizes="100vw"
              src={currentImage}
              unoptimized
            />
          </div>

          <button
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/35 bg-black/60 px-3 py-2 text-xl text-white transition hover:bg-black/80 md:right-6"
            type="button"
            onClick={() => setActiveIndex((current) => (current + 1) % totalImages)}
          >
            →
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-3 pt-8 md:px-6 md:pb-6">
          <div className="flex gap-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={`${index}-${image.slice(0, 32)}`}
                aria-label={`View image ${index + 1}`}
                className={
                  index === activeIndex
                    ? "relative h-16 w-24 shrink-0 overflow-hidden"
                    : "relative h-16 w-24 shrink-0 overflow-hidden opacity-65 transition hover:opacity-100"
                }
                type="button"
                onClick={() => setActiveIndex(index)}
              >
                <Image alt="" className="object-cover" fill sizes="96px" src={image} unoptimized />
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
