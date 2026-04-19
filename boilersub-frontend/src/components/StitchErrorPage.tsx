import Link from "next/link";

export function StitchErrorPage({
  title = "Page not found",
  subtitle = "Looks like this sublease wandered off campus. Let's get you back to browsing.",
  primaryLabel = "Browse Listings",
  primaryHref = "/listings",
  secondaryLabel = "Back to Home",
  secondaryHref = "/",
  tertiaryTitle = "Search Tip",
  tertiaryBody = 'Try filtering by "Near Campus" or "Quiet" vibes to find active listings.',
  supportTitle = "Support",
  supportBody = "Can't find a specific unit? Reach out to our curator team for assistance.",
  statusTitle = "Live Status",
  statusBody = "142 new subleases were posted in the last 24 hours.",
  onPrimaryAction,
}: {
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  tertiaryTitle?: string;
  tertiaryBody?: string;
  supportTitle?: string;
  supportBody?: string;
  statusTitle?: string;
  statusBody?: string;
  onPrimaryAction?: () => void;
}) {
  return (
    <main className="relative flex min-h-[calc(100vh-9rem)] flex-col overflow-x-hidden text-[#2f2f2e]">
      <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden">
        <span className="-translate-y-12 text-[30rem] font-display font-extrabold leading-none tracking-tighter text-[#6a5a32]/[0.03] md:text-[45rem]">
          404
        </span>
      </div>

      <section className="relative z-10 flex flex-1 items-center justify-center px-6 py-24">
        <div className="w-full max-w-4xl space-y-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-3 w-3 rounded-full bg-[#a03a0f]" />
          </div>

          <div className="space-y-6">
            <h1 className="font-display text-6xl font-extrabold leading-[0.9] tracking-tighter text-[#2f2f2e] md:text-8xl lg:text-9xl lg:leading-[0.85]">
              {title}
            </h1>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-[#5c5b5b] md:text-2xl">{subtitle}</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 pt-4 md:flex-row">
            {onPrimaryAction ? (
              <button
                className="rounded-full bg-gradient-to-br from-[#0052d0] to-[#afc2ff] px-10 py-5 font-display text-lg font-bold text-[#f1f2ff] shadow-[0px_12px_32px_rgba(0,82,208,0.2)] transition-all duration-300 hover:scale-105 active:scale-95"
                type="button"
                onClick={onPrimaryAction}
              >
                {primaryLabel}
              </button>
            ) : (
              <Link
                className="rounded-full bg-gradient-to-br from-[#0052d0] to-[#afc2ff] px-10 py-5 font-display text-lg font-bold text-[#f1f2ff] shadow-[0px_12px_32px_rgba(0,82,208,0.2)] transition-all duration-300 hover:scale-105 active:scale-95"
                href={primaryHref}
              >
                {primaryLabel}
              </Link>
            )}

            <Link
              className="flex items-center gap-2 rounded-full px-10 py-5 font-display text-lg font-bold text-[#6a5a32] transition-all duration-300 hover:bg-[#dfdcdc]"
              href={secondaryHref}
            >
              <span aria-hidden="true" className="text-xl">
                ←
              </span>
              {secondaryLabel}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 border-t border-[#6a5a32]/5 pt-24 text-left md:grid-cols-3">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#a03a0f]">{tertiaryTitle}</span>
              <p className="text-sm text-[#5c5b5b]">{tertiaryBody}</p>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#6a5a32]">{supportTitle}</span>
              <p className="text-sm text-[#5c5b5b]">{supportBody}</p>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#6a5a32]">{statusTitle}</span>
              <p className="text-sm text-[#5c5b5b]">{statusBody}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed right-[-6rem] top-1/4 h-96 w-96 rounded-full bg-[#6a5a32]/5 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-1/4 left-[-6rem] h-96 w-96 rounded-full bg-[#0052d0]/5 blur-[120px]" />
    </main>
  );
}
