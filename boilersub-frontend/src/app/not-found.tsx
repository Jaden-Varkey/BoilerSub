import Link from "next/link";
import { buttonClassName } from "@/components/Button";

export default function NotFound() {
  return (
    <main className="page-wrap py-24">
      <div className="mx-auto max-w-2xl panel p-12 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-6xl">The listing moved. You didn&apos;t.</h1>
        <p className="mt-5 text-sm leading-7 text-slate-600">
          This route doesn&apos;t resolve to a BoilerSub page. Head back to the live marketplace and pick up from there.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/listings" className={buttonClassName()}>
            Back to Listings
          </Link>
          <Link href="/" className={buttonClassName("secondary")}>
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
