"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";
import { MAX_LISTING_IMAGES, readListingImages } from "@/lib/listingImages";
import { amenityOptions, emptyListingPayload } from "@/lib/validators";

export default function NewListingPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyListingPayload());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <ProtectedRoute requireVerified>
      <main className="px-6 pb-24 pt-32 md:px-12">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-16 lg:flex-row">
          <div className="flex-1">
            <header className="mb-12">
              <h1 className="mb-4 font-display text-5xl font-extrabold tracking-tight text-[#2f2f2e] md:text-6xl">
                List Your Sublease
              </h1>
              <p className="max-w-xl text-lg text-[#5c5b5b]">
                Join the community of Boilermakers helping each other find the perfect home away from home.
              </p>
            </header>

            <form
              className="space-y-10"
              onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                setMessage(null);

                if (!form.title.trim()) {
                  setMessage("Add a listing title.");
                  return;
                }

                if (!form.address?.trim()) {
                  setMessage("Add the property address.");
                  return;
                }

                if (!form.price || form.price <= 0) {
                  setMessage("Enter a valid monthly price.");
                  return;
                }

                if (!form.start_date || !form.end_date) {
                  setMessage("Set both availability dates.");
                  return;
                }

                if (!form.images.length) {
                  setMessage("Upload at least one JPEG image.");
                  return;
                }

                setBusy(true);
                try {
                  const listing = await apiClient.listings.create({
                    ...form,
                    title: form.title.trim(),
                    address: form.address?.trim() ?? "",
                    description: form.description?.trim() ? form.description.trim() : null,
                  });
                  router.push(`/listings/${listing.id}`);
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Failed to publish listing");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {message ? <Toast kind="error" message={message} /> : null}

              <section className="space-y-4">
                <label className="block text-sm font-bold uppercase tracking-widest text-[#5c5b5b]/70">Gallery</label>
                <label className="group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#afadac]/30 bg-[#e4e2e1] md:aspect-[21/9]">
                  <input
                    accept=".jpg,.jpeg,image/jpeg"
                    className="sr-only"
                    multiple
                    type="file"
                    onChange={async (event: ChangeEvent<HTMLInputElement>) => {
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
                  <span className="font-bold text-[#5c5b5b]">
                    {form.images.length ? `${form.images.length} JPEG photo${form.images.length === 1 ? "" : "s"} ready` : "Upload JPEG Photos"}
                  </span>
                  <span className="text-sm text-[#5c5b5b]/60">Select up to {MAX_LISTING_IMAGES} high-resolution JPEG images</span>
                  <div className="pointer-events-none absolute inset-0 bg-[#0052d0]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </label>
                {form.images.length ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {form.images.map((image, index) => (
                      <div key={`${index}-${image.slice(0, 32)}`} className="overflow-hidden rounded-2xl bg-[#e4e2e1] shadow-sm">
                        <img alt={`Listing upload ${index + 1}`} className="aspect-[4/3] h-full w-full object-cover" src={image} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="ml-1 block text-sm font-bold uppercase tracking-widest text-[#5c5b5b]/70">
                    Listing Title
                  </label>
                  <input
                    className="w-full rounded-xl bg-[#e4e2e1] px-6 py-4 font-medium text-[#2f2f2e] placeholder:text-[#5c5b5b]/40 focus:outline-none focus:ring-2 focus:ring-[#0052d0]/15"
                    placeholder="e.g. Spacious 1BR in Hub State Street"
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="ml-1 block text-sm font-bold uppercase tracking-widest text-[#5c5b5b]/70">
                    Address
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl bg-[#e4e2e1] px-6 py-4 font-medium text-[#2f2f2e] placeholder:text-[#5c5b5b]/40 focus:outline-none focus:ring-2 focus:ring-[#0052d0]/15"
                      placeholder="Street Address, West Lafayette, IN"
                      type="text"
                      value={form.address ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5c5b5b]">📍</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold uppercase tracking-widest text-[#5c5b5b]/70">
                    Monthly Price ($)
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl bg-[#e4e2e1] px-6 py-4 pl-14 font-medium text-[#2f2f2e] placeholder:text-[#5c5b5b]/40 focus:outline-none focus:ring-2 focus:ring-[#0052d0]/15"
                      placeholder="850"
                      type="number"
                      value={form.price || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          price: Number(event.target.value || 0),
                        }))
                      }
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#5c5b5b]">/mo</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold uppercase tracking-widest text-[#5c5b5b]/70">
                    Layout
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      className="rounded-xl bg-[#e4e2e1] px-6 py-4 font-medium text-[#2f2f2e] placeholder:text-[#5c5b5b]/40 focus:outline-none focus:ring-2 focus:ring-[#0052d0]/15"
                      placeholder="Beds"
                      type="number"
                      value={form.bedrooms ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          bedrooms: event.target.value ? Number(event.target.value) : null,
                        }))
                      }
                    />
                    <input
                      className="rounded-xl bg-[#e4e2e1] px-6 py-4 font-medium text-[#2f2f2e] placeholder:text-[#5c5b5b]/40 focus:outline-none focus:ring-2 focus:ring-[#0052d0]/15"
                      placeholder="Baths"
                      type="number"
                      step="0.5"
                      value={form.bathrooms ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          bathrooms: event.target.value ? Number(event.target.value) : null,
                        }))
                      }
                    />
                    <input
                      className="rounded-xl bg-[#e4e2e1] px-4 py-4 font-medium text-[#2f2f2e] placeholder:text-[#5c5b5b]/40 focus:outline-none focus:ring-2 focus:ring-[#0052d0]/15"
                      placeholder="Miles"
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.distance ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          distance: event.target.value ? Number(event.target.value) : null,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold uppercase tracking-widest text-[#5c5b5b]/70">
                    Available From
                  </label>
                  <input
                    className="w-full rounded-xl bg-[#e4e2e1] px-6 py-4 text-sm font-medium uppercase text-[#2f2f2e] focus:outline-none focus:ring-2 focus:ring-[#0052d0]/15"
                    type="date"
                    value={form.start_date}
                    onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold uppercase tracking-widest text-[#5c5b5b]/70">
                    Available To
                  </label>
                  <input
                    className="w-full rounded-xl bg-[#e4e2e1] px-6 py-4 text-sm font-medium uppercase text-[#2f2f2e] focus:outline-none focus:ring-2 focus:ring-[#0052d0]/15"
                    type="date"
                    value={form.end_date ?? ""}
                    onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <label className="ml-1 block text-sm font-bold uppercase tracking-widest text-[#5c5b5b]/70">Amenities</label>
                <div className="flex flex-wrap gap-3">
                  {amenityOptions.map((amenity) => {
                    const active = form.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        className={
                          active
                            ? "rounded-full bg-[#0052d0] px-5 py-2 text-sm font-semibold text-[#f1f2ff] shadow-lg shadow-[#0052d0]/20"
                            : "rounded-full bg-[#e4e2e1] px-5 py-2 text-sm font-semibold text-[#2f2f2e] transition-all hover:bg-[#0052d0]/10 hover:text-[#0052d0]"
                        }
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            amenities: current.amenities.includes(amenity)
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
              </section>

              <section className="space-y-2">
                <label className="ml-1 block text-sm font-bold uppercase tracking-widest text-[#5c5b5b]/70">
                  Description
                </label>
                <textarea
                  className="w-full resize-none rounded-2xl bg-[#e4e2e1] px-6 py-6 font-medium text-[#2f2f2e] placeholder:text-[#5c5b5b]/40 focus:outline-none focus:ring-2 focus:ring-[#0052d0]/15"
                  placeholder="Tell us about the roommates, the vibe, and why someone should live here..."
                  rows={6}
                  value={form.description ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </section>

              <footer className="flex flex-col items-center justify-between gap-8 pt-8 md:flex-row">
                <div className="flex items-center gap-3 text-[#5c5b5b]/80">
                  <span className="text-[#6a5a32]">✓</span>
                  <p className="text-sm font-medium">Only verified Purdue students can publish listings</p>
                </div>
                <div className="flex w-full items-center gap-8 md:w-auto">
                  <button
                    className="font-bold tracking-tight text-[#5c5b5b] transition-colors hover:text-[#a03a0f]"
                    type="button"
                    onClick={() => router.push("/listings")}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 rounded-xl bg-gradient-to-br from-[#0052d0] to-[#0047b7] px-10 py-4 font-bold text-[#f1f2ff] shadow-xl shadow-[#0052d0]/20 transition-all hover:scale-[1.02] active:scale-[0.98] md:flex-none disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={busy}
                    type="submit"
                  >
                    {busy ? "Publishing…" : "Publish Listing"}
                  </button>
                </div>
              </footer>
            </form>
          </div>

          <aside className="space-y-8 lg:w-96">
            <div className="sticky top-32">
              <div className="group relative overflow-hidden rounded-3xl bg-[#f3f0ef] p-8">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#6a5a32]/10 blur-2xl transition-all duration-700 group-hover:bg-[#6a5a32]/20" />
                <h3 className="relative z-10 mb-6 text-2xl font-extrabold text-[#2f2f2e]">Tips for a strong listing</h3>
                <ul className="relative z-10 space-y-6">
                  <li className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <span className="text-lg text-[#0052d0]">🖼</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2f2f2e]">Visuals Matter</h4>
                      <p className="mt-1 text-sm leading-relaxed text-[#5c5b5b]">
                        Bright, well-lit photos increase clicks by over 40%. Show the common areas too.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <span className="text-lg text-[#a03a0f]">⚡</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2f2f2e]">Be Kinetic</h4>
                      <p className="mt-1 text-sm leading-relaxed text-[#5c5b5b]">
                        Mention if it&apos;s near a bus stop or a specific academic building like WALC or PMU.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <span className="text-lg text-[#6a5a32]">💬</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2f2f2e]">Clear Details</h4>
                      <p className="mt-1 text-sm leading-relaxed text-[#5c5b5b]">
                        Clearly state the utility situation. Students prefer all-inclusive pricing.
                      </p>
                    </div>
                  </li>
                </ul>
                <div className="mt-10 rounded-2xl border-l-4 border-[#a03a0f] bg-[#ff946e]/20 p-4">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#902e02]">High Demand</p>
                  <p className="text-sm font-medium text-[#5c1a00]">
                    Listings for the Spring semester are currently receiving 2x normal traffic.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex cursor-pointer items-center gap-4 px-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e4e2e1] transition-colors hover:bg-[#fee6b2]">
                  <span className="text-[#5c5b5b]">?</span>
                </div>
                <div>
                  <p className="font-bold text-[#2f2f2e]">Need help?</p>
                  <p className="text-sm text-[#5c5b5b]">View our Safety Guide</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </ProtectedRoute>
  );
}
