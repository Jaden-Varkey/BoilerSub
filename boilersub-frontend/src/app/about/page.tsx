import Link from "next/link";

const pillars = [
  {
    title: "Purdue-Only Access",
    description: "Every account is tied to a @purdue.edu identity so students browse and connect in a verified community.",
  },
  {
    title: "Verified Student Network",
    description: "Listings and profiles are built for Boilermakers, reducing noise from public marketplaces.",
  },
  {
    title: "Faster Sublease Matching",
    description: "Purpose-built listing flows make it easier to discover homes near campus and move quickly.",
  },
  {
    title: "Trust First Experience",
    description: "BoilerSub is designed around secure account verification, clear ownership, and student safety.",
  },
];

const steps = [
  "Create your BoilerSub account with a Purdue email",
  "Verify your account through email and phone",
  "Browse or post subleases near campus",
  "Connect and close the lease transition with confidence",
];

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-14 text-[#2f2f2e] md:px-10 md:py-20">
      <section className="rounded-3xl bg-gradient-to-br from-[#6a5a32] via-[#5e4e27] to-[#2f2f2e] p-10 text-[#fff1d9] shadow-[0_20px_60px_rgba(0,0,0,0.18)] md:p-14">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#fee6b2]">About BoilerSub</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight md:text-6xl">
          Built for Purdue students, not the open internet.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-[#fee6b2]/90">
          BoilerSub is a Purdue-focused sublease marketplace designed to make housing transitions faster, safer, and more
          transparent for the student community.
        </p>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-2xl border border-[#e4e2e1] bg-[#f9f6f5] p-7 shadow-[0_10px_32px_rgba(0,0,0,0.05)]">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#2f2f2e]">{pillar.title}</h2>
            <p className="mt-3 leading-relaxed text-[#5c5b5b]">{pillar.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-14 rounded-2xl border border-[#e4e2e1] bg-[#dfdcdc]/40 p-8 md:p-10">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#2f2f2e]">How BoilerSub works</h2>
        <ol className="mt-6 space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-4">
              <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0052d0] text-sm font-bold text-[#f1f2ff]">
                {index + 1}
              </span>
              <span className="text-[#5c5b5b]">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#0052d0] px-7 py-6 text-[#f1f2ff]">
        <p className="font-display text-xl font-bold tracking-tight">Ready to find your next Purdue sublease?</p>
        <div className="flex gap-3">
          <Link className="rounded-lg bg-white px-5 py-2.5 font-display font-bold text-[#0052d0] transition hover:opacity-90" href="/listings">
            Explore Listings
          </Link>
          <Link className="rounded-lg border border-white/50 px-5 py-2.5 font-display font-bold text-white transition hover:bg-white/10" href="/signup">
            Create Account
          </Link>
        </div>
      </section>
    </main>
  );
}
