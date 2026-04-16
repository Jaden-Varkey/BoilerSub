import Link from "next/link";
import type { Listing } from "@/lib/types";
import { VerificationBadge } from "@/components/VerificationBadge";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group glass-card flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-brand-blue via-[#5d8ff0] to-brand-coral">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_30%),radial-gradient(circle_at_80%_30%,white,transparent_25%),linear-gradient(135deg,transparent_20%,rgba(255,255,255,0.35)_20%,rgba(255,255,255,0.35)_24%,transparent_24%)]" />
        <div className="absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue">
          Purdue
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl leading-tight text-brand-ink">{listing.title}</h3>
          <span className="rounded-full bg-brand-sand px-3 py-1 text-sm font-semibold text-brand-coral">
            ${listing.price}/mo
          </span>
        </div>
        <p className="text-sm text-slate-600">
          {listing.address ?? "West Lafayette"} · {listing.start_date} to {listing.end_date ?? "Open"}
        </p>
        <p className="text-sm text-slate-700">
          {listing.bedrooms ?? "?"} bd · {listing.bathrooms ?? "?"} ba
        </p>
        {listing.owner && (
          <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
            <span className="font-medium text-slate-800">{listing.owner.full_name ?? listing.owner.email}</span>
            <VerificationBadge verified={listing.owner.fully_verified} />
          </div>
        )}
      </div>
    </Link>
  );
}
