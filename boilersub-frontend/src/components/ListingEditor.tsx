"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AddressAutocompleteInput } from "@/components/AddressAutocompleteInput";
import { AmenityChip } from "@/components/AmenityChip";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";
import { Toast } from "@/components/Toast";
import { MAX_LISTING_IMAGES, readListingImages } from "@/lib/listingImages";
import { amenityOptions, emptyListingPayload } from "@/lib/validators";
import type { Listing, ListingPayload } from "@/lib/types";

type FormState = {
  title: string;
  description: string;
  price: string;
  start_date: string;
  end_date: string;
  bedrooms: string;
  bathrooms: string;
  distance: string;
  address: string;
  amenities: string[];
  images: string[];
  panorama_image: string | null;
};

function toFormState(initial?: Partial<Listing | ListingPayload>): FormState {
  const payload = initial ?? emptyListingPayload();
  return {
    title: payload.title ?? "",
    description: payload.description ?? "",
    price: payload.price?.toString() ?? "",
    start_date: payload.start_date ?? "",
    end_date: payload.end_date ?? "",
    bedrooms: payload.bedrooms?.toString() ?? "",
    bathrooms: payload.bathrooms?.toString() ?? "",
    distance: payload.distance?.toString() ?? "",
    address: payload.address ?? "",
    amenities: payload.amenities ?? [],
    images: payload.images ?? [],
    panorama_image: payload.panorama_image ?? null,
  };
}

function toPayload(state: FormState): ListingPayload {
  return {
    title: state.title,
    description: state.description || null,
    price: Number(state.price || 0),
    start_date: state.start_date,
    end_date: state.end_date,
    bedrooms: state.bedrooms ? Number(state.bedrooms) : null,
    bathrooms: state.bathrooms ? Number(state.bathrooms) : null,
    distance: state.distance ? Number(state.distance) : null,
    address: state.address || null,
    amenities: state.amenities,
    images: state.images,
    panorama_image: state.panorama_image,
  };
}

export function ListingEditor({
  initial,
  title,
  description,
  submitLabel,
  busyLabel,
  variant = "default",
  cancelHref,
  onDelete,
  deleteLabel = "Delete Listing",
  deletingLabel = "Deleting...",
  onSubmit,
}: {
  initial?: Partial<Listing | ListingPayload>;
  title: string;
  description: string;
  submitLabel: string;
  busyLabel: string;
  variant?: "default" | "stitchEdit";
  cancelHref?: string;
  onDelete?: () => Promise<void>;
  deleteLabel?: string;
  deletingLabel?: string;
  onSubmit: (payload: ListingPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(initial));
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const payload = useMemo(() => toPayload(form), [form]);
  const owner = initial && "owner" in initial ? initial.owner : undefined;
  const previewImage = form.images[0];
  const panoramaPreviewImage = form.panorama_image;

  if (variant === "stitchEdit") {
    return (
      <section className="page-wrap pb-24 pt-10">
        <div className="mb-12 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="font-display text-4xl font-black tracking-[-0.06em] text-stone-900 md:text-5xl">{title}</h1>
            <span className="flex items-center gap-2 rounded-full border border-[#ff946e]/30 bg-[#ff946e]/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#5c1a00]">
              <span className="h-2 w-2 rounded-full bg-[#a03a0f]" />
              Live
            </span>
          </div>
          <p className="text-lg text-stone-600">{description}</p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
          <form
            className="space-y-10"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setMessage(null);
              try {
                await onSubmit(payload);
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Failed to save listing");
              } finally {
                setBusy(false);
              }
            }}
          >
            {message && <Toast kind="error" message={message} />}

            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#6a5a32]">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-stone-500" htmlFor="title">
                    Listing Title
                  </label>
                  <Input
                    className="rounded-xl border-none bg-[#dfdcdc] px-6 py-4 text-lg font-medium text-stone-900 focus:ring-2 focus:ring-[#0052d0]"
                    id="title"
                    required
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-stone-500" htmlFor="description">
                    Property Description
                  </label>
                  <Textarea
                    className="min-h-40 rounded-xl border-none bg-[#dfdcdc] px-6 py-4 leading-7 text-stone-900 focus:ring-2 focus:ring-[#0052d0]"
                    id="description"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#6a5a32]">Pricing & Availability</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-stone-500" htmlFor="price">
                    Monthly Rent
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-stone-500">$</span>
                    <Input
                      className="rounded-xl border-none bg-[#dfdcdc] py-4 pl-10 pr-6 text-xl font-black text-stone-900 focus:ring-2 focus:ring-[#0052d0]"
                      id="price"
                      min="0"
                      required
                      step="1"
                      type="number"
                      value={form.price}
                      onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      className="rounded-xl border-none bg-[#dfdcdc] px-4 py-4 font-medium text-stone-900 focus:ring-2 focus:ring-[#0052d0]"
                      id="start_date"
                      required
                      type="date"
                      value={form.start_date}
                      onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
                    />
                    <Input
                      className="rounded-xl border-none bg-[#dfdcdc] px-4 py-4 font-medium text-stone-900 focus:ring-2 focus:ring-[#0052d0]"
                      id="end_date"
                      required
                      type="date"
                      value={form.end_date}
                      onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#6a5a32]">Location & Specs</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-stone-500" htmlFor="address">
                    Full Address
                  </label>
                  <AddressAutocompleteInput
                    className="rounded-xl border-none bg-[#dfdcdc] px-6 py-4 font-medium text-stone-900 focus:ring-2 focus:ring-[#0052d0]"
                    id="address"
                    value={form.address}
                    onValueChange={(value) => setForm((current) => ({ ...current, address: value }))}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                    Configuration
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      className="rounded-xl border-none bg-[#dfdcdc] px-4 py-4 font-medium text-stone-900 focus:ring-2 focus:ring-[#0052d0]"
                      id="bedrooms"
                      min="0"
                      step="1"
                      type="number"
                      value={form.bedrooms}
                      onChange={(event) => setForm((current) => ({ ...current, bedrooms: event.target.value }))}
                    />
                    <Input
                      className="rounded-xl border-none bg-[#dfdcdc] px-4 py-4 font-medium text-stone-900 focus:ring-2 focus:ring-[#0052d0]"
                      id="bathrooms"
                      min="0"
                      step="0.5"
                      type="number"
                      value={form.bathrooms}
                      onChange={(event) => setForm((current) => ({ ...current, bathrooms: event.target.value }))}
                    />
                    <Input
                      className="rounded-xl border-none bg-[#dfdcdc] px-4 py-4 font-medium text-stone-900 focus:ring-2 focus:ring-[#0052d0]"
                      id="distance"
                      min="0"
                      step="0.1"
                      type="number"
                      value={form.distance}
                      onChange={(event) => setForm((current) => ({ ...current, distance: event.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#6a5a32]">Amenities & Perks</h2>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0052d0]">Edit All</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {amenityOptions.map((amenity) => {
                  const active = form.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      className={
                        active
                          ? "rounded-full border-2 border-transparent bg-[#c3d0ff] px-5 py-2.5 text-sm font-bold text-[#0040a5] transition-all hover:border-[#0052d0]"
                          : "rounded-full border-2 border-transparent bg-[#e4e2e1] px-5 py-2.5 text-sm font-bold text-stone-600 transition-all hover:bg-[#dfdcdc]"
                      }
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          amenities: active
                            ? current.amenities.filter((item) => item !== amenity)
                            : [...current.amenities, amenity],
                        }))
                      }
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#6a5a32]">Photos</h2>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">JPEG only, up to {MAX_LISTING_IMAGES}</span>
              </div>
              <Input
                accept=".jpg,.jpeg,image/jpeg"
                className="rounded-xl border-none bg-[#dfdcdc] px-6 py-4 text-sm font-medium text-stone-900 file:mr-4 file:rounded-full file:border-0 file:bg-[#0052d0] file:px-4 file:py-2 file:font-semibold file:text-white"
                id="images"
                multiple
                type="file"
                onChange={async (event) => {
                  const files = event.target.files;
                  if (!files) {
                    return;
                  }

                  try {
                    const images = await readListingImages(files);
                    setForm((current) => ({ ...current, images }));
                    setMessage(null);
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : "Failed to process images");
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
              {form.images.length ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {form.images.map((image, index) => (
                    <div key={`${index}-${image.slice(0, 32)}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200">
                      <Image
                        alt={`Listing upload ${index + 1}`}
                        className="aspect-[4/3] object-cover"
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        src={image}
                        unoptimized={image.startsWith("data:image/")}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#6a5a32]">Panorama</h2>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Single JPEG for 360 view</span>
              </div>
              <Input
                accept=".jpg,.jpeg,image/jpeg"
                className="rounded-xl border-none bg-[#dfdcdc] px-6 py-4 text-sm font-medium text-stone-900 file:mr-4 file:rounded-full file:border-0 file:bg-[#0052d0] file:px-4 file:py-2 file:font-semibold file:text-white"
                id="panorama_image"
                type="file"
                onChange={async (event) => {
                  const files = event.target.files;
                  if (!files?.length) {
                    return;
                  }

                  try {
                    const [panoramaImage] = await readListingImages([files[0]]);
                    setForm((current) => ({ ...current, panorama_image: panoramaImage ?? null }));
                    setMessage(null);
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : "Failed to process panorama image");
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
              {panoramaPreviewImage ? (
                <div className="relative aspect-[2/1] overflow-hidden rounded-2xl bg-stone-200">
                  <Image
                    alt="Panorama upload preview"
                    className="object-cover"
                    fill
                    sizes="(min-width: 1024px) 380px, 100vw"
                    src={panoramaPreviewImage}
                    unoptimized={panoramaPreviewImage.startsWith("data:image/")}
                  />
                </div>
              ) : (
                <p className="text-sm text-stone-500">Upload the panoramic room image that should open when renters click View 3D.</p>
              )}
            </div>

            <div className="flex flex-col gap-6 border-t border-stone-200 pt-8 sm:flex-row sm:items-center">
              <Button
                className="w-full rounded-xl px-10 py-5 text-lg shadow-[0_20px_40px_rgba(0,82,208,0.2)] sm:w-auto"
                disabled={busy}
                type="submit"
              >
                {busy ? busyLabel : submitLabel}
              </Button>

              {cancelHref ? (
                <Link className="font-semibold text-stone-500 transition-colors hover:text-stone-900" href={cancelHref}>
                  Cancel
                </Link>
              ) : null}

              <div className="hidden flex-1 sm:block" />

              {onDelete ? (
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-[#a03a0f] transition-colors hover:bg-[#ff946e]/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  disabled={deleting || busy}
                  type="button"
                  onClick={async () => {
                    const confirmed = window.confirm(`Delete "${payload.title || "this listing"}"? This cannot be undone.`);
                    if (!confirmed) {
                      return;
                    }

                    setDeleting(true);
                    setMessage(null);
                    try {
                      await onDelete();
                    } catch (error) {
                      setMessage(error instanceof Error ? error.message : "Failed to delete listing");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? deletingLabel : deleteLabel}
                </button>
              ) : null}
            </div>
          </form>

          <aside className="space-y-8 lg:sticky lg:top-28">
            <div className="group rounded-[2rem] bg-white/92 p-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
              <div className="relative mb-6 h-48 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#dfe8ff_0%,#fef2d2_45%,#ffd8cb_100%)]">
                {previewImage ? (
                  <Image
                    alt={payload.title || "Listing preview"}
                    className="object-cover"
                    fill
                    sizes="380px"
                    src={previewImage}
                    unoptimized={previewImage.startsWith("data:image/")}
                  />
                ) : null}
                <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.24em] text-[#6a5a32] backdrop-blur-md">
                  Preview
                </div>
              </div>
              {panoramaPreviewImage ? (
                <div className="mb-6 overflow-hidden rounded-2xl border border-[#c3d0ff] bg-[#eff3ff] p-3">
                  <p className="mb-2 text-[0.65rem] font-black uppercase tracking-[0.22em] text-[#0052d0]">360 Preview Ready</p>
                  <div className="relative aspect-[2/1] overflow-hidden rounded-xl">
                    <Image
                      alt="Panorama preview"
                      className="object-cover"
                      fill
                      sizes="380px"
                      src={panoramaPreviewImage}
                      unoptimized={panoramaPreviewImage.startsWith("data:image/")}
                    />
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-xl font-black tracking-[-0.04em] text-stone-900">
                    {payload.title || "Untitled listing"}
                  </h3>
                  <span className="font-display text-xl font-black text-[#0052d0]">
                    ${payload.price || 0}
                  </span>
                </div>
                <p className="text-sm text-stone-500">{payload.address || "Add an address"}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a5a32]">
                  {payload.distance != null ? `${payload.distance} miles from campus` : "Add distance from campus"}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#fee6b2]/40 bg-[#fee6b2]/25 p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[#0052d0] p-2 text-white">
                  <span aria-hidden="true">↻</span>
                </div>
                <div>
                  <h4 className="font-display text-lg font-black tracking-[-0.03em] text-stone-900">Instant Sync</h4>
                  <p className="mt-1 text-sm leading-7 text-stone-600">
                    Changes update immediately across BoilerSub after you save, so browse, detail, and profile views stay in sync.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-stone-100/80 p-8">
              <h4 className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-[#6a5a32]">Listing Owner</h4>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-lg font-black text-stone-700">
                  {(owner?.full_name ?? "Y").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-stone-900">{owner?.full_name ?? "Your listing"}</p>
                  <p className="text-xs text-stone-500">
                    {owner?.fully_verified ? "Verified Purdue student" : "Verified status pending"}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="page-wrap">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="panel p-8">
          <p className="eyebrow">Publish your sublease</p>
          <h1 className="mt-3 font-display text-4xl text-brand-ink">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>
          <div className="mt-8 rounded-[1.5rem] bg-brand-blue p-5 text-sm text-white">
            BoilerSub uses a single backend contract, so once this form succeeds the new state is immediately available in
            browse, detail, and profile views.
          </div>
        </aside>

        <form
          className="panel space-y-6 p-8"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setMessage(null);
            try {
              await onSubmit(payload);
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Failed to save listing");
            } finally {
              setBusy(false);
            }
          }}
        >
          {message && <Toast kind="error" message={message} />}

          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="description">
              Description
            </label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="price">
                Monthly price
              </label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="address">
                Address
              </label>
              <AddressAutocompleteInput
                id="address"
                value={form.address}
                onValueChange={(value) => setForm((current) => ({ ...current, address: value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="start_date">
                Start date
              </label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="end_date">
                End date
              </label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="bedrooms">
                Bedrooms
              </label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                step="1"
                value={form.bedrooms}
                onChange={(event) => setForm((current) => ({ ...current, bedrooms: event.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="bathrooms">
                Bathrooms
              </label>
              <Input
                id="bathrooms"
                type="number"
                min="0"
                step="0.5"
                value={form.bathrooms}
                onChange={(event) => setForm((current) => ({ ...current, bathrooms: event.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="distance">
                Distance from campus (miles)
              </label>
              <Input
                id="distance"
                type="number"
                min="0"
                step="0.1"
                value={form.distance}
                onChange={(event) => setForm((current) => ({ ...current, distance: event.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="images">
              Listing images
            </label>
            <Input
              id="images"
              accept=".jpg,.jpeg,image/jpeg"
              multiple
              type="file"
              onChange={async (event) => {
                const files = event.target.files;
                if (!files) {
                  return;
                }

                try {
                  const images = await readListingImages(files);
                  setForm((current) => ({ ...current, images }));
                  setMessage(null);
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Failed to process images");
                } finally {
                  event.target.value = "";
                }
              }}
            />
            <p className="mt-2 text-xs text-slate-500">JPEG only, up to {MAX_LISTING_IMAGES} files.</p>
            {form.images.length ? (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {form.images.map((image, index) => (
                  <div key={`${index}-${image.slice(0, 32)}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      alt={`Listing upload ${index + 1}`}
                      className="object-cover"
                      fill
                      sizes="(min-width: 768px) 33vw, 50vw"
                      src={image}
                      unoptimized={image.startsWith("data:image/")}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <label className="label" htmlFor="panorama_image">
              Panorama image
            </label>
            <Input
              id="panorama_image"
              accept=".jpg,.jpeg,image/jpeg"
              type="file"
              onChange={async (event) => {
                const files = event.target.files;
                if (!files?.length) {
                  return;
                }

                try {
                  const [panoramaImage] = await readListingImages([files[0]]);
                  setForm((current) => ({ ...current, panorama_image: panoramaImage ?? null }));
                  setMessage(null);
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Failed to process panorama image");
                } finally {
                  event.target.value = "";
                }
              }}
            />
            <p className="mt-2 text-xs text-slate-500">Optional single JPEG panorama used for the View 3D experience.</p>
            {form.panorama_image ? (
              <div className="mt-4 relative aspect-[2/1] overflow-hidden rounded-2xl bg-slate-100">
                <Image
                  alt="Panorama upload preview"
                  className="object-cover"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  src={form.panorama_image}
                  unoptimized={form.panorama_image.startsWith("data:image/")}
                />
              </div>
            ) : null}
          </div>

          <div>
            <span className="label">Amenities</span>
            <div className="flex flex-wrap gap-2">
              {amenityOptions.map((amenity) => {
                const active = form.amenities.includes(amenity);
                return (
                  <AmenityChip
                    key={amenity}
                    label={amenity}
                    active={active}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        amenities: active
                          ? current.amenities.filter((item) => item !== amenity)
                          : [...current.amenities, amenity],
                      }))
                    }
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-brand-sand/70 p-4 text-sm text-slate-700">
            Preview: {payload.title || "Untitled listing"} · ${payload.price || 0}/mo · {payload.start_date || "TBD"} to{" "}
            {payload.end_date || "TBD"}
          </div>

          <Button className="w-full" disabled={busy} type="submit">
            {busy ? busyLabel : submitLabel}
          </Button>
        </form>
      </div>
    </section>
  );
}
