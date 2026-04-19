"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/Nav";

const AUTH_ROUTES = ["/login", "/signup", "/verify-email", "/verify-phone"];

function shouldHideChrome(pathname: string) {
  return (
    AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  );
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = shouldHideChrome(pathname);

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Nav />
      {children}
      <footer className="border-t border-slate-200/70 bg-white/40">
        <div className="page-wrap flex flex-col gap-3 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>BoilerSub is built for Purdue students sharing subleases with other Purdue students.</p>
          <div className="flex gap-5">
            <Link href="/">About</Link>
            <Link href="/listings">Browse</Link>
            <Link href="/profile">Profile</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
