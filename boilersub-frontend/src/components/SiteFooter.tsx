"use client";

import Link from "next/link";

const footerLinks = [
  { href: "#", label: "About Us" },
  { href: "#", label: "Contact" },
  { href: "#", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full bg-stone-100 py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-12 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
          <div className="font-display text-lg font-bold text-stone-800">BoilerSub</div>
          <p className="text-sm tracking-wide text-stone-500">© 2024 BoilerSub. The Kinetic Curator for Purdue Housing.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:justify-end md:text-right">
          {footerLinks.map((item) => (
            <Link
              key={item.label}
              className="text-sm tracking-wide text-stone-500 underline decoration-blue-500/30 transition-all hover:text-stone-900"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
