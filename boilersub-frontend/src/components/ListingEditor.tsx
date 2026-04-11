"use client";

import { useMemo, useState } from "react";
import { AmenityChip } from "@/components/AmenityChip";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";
import { Toast } from "@/components/Toast";
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
  address: string;
  amenities: string[];
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
    address: payload.address ?? "",
    amenities: payload.amenities ?? [],
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
    address: state.address || null,
    amenities: state.amenities,
  };
}

export function ListingEditor({
  initial,
  title,
  description,
  submitLabel,
  busyLabel,
  onSubmit,
}: {
  initial?: Partial<Listing | ListingPayload>;
  title: string;
  description: string;
  submitLabel: string;
  busyLabel: string;
  onSubmit: (payload: ListingPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(initial));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const payload = useMemo(() => toPayload(form), [form]);

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
              <Input
                id="address"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
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
