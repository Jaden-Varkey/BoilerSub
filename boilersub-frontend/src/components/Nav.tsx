"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthLaunchLink } from "@/components/AuthLaunchLink";
import { useAuth } from "@/context/AuthProvider";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isExplore = pathname === "/";
  const isListings = pathname === "/listings" || pathname.startsWith("/listings/");
  const isSublease = pathname === "/listings/new";

  return (
    <header className="sticky top-0 z-40 w-full bg-stone-50/70 shadow-[0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <div className="flex max-w-full items-center justify-between px-8 py-4">
        <Link className="font-display text-2xl font-black tracking-tighter text-stone-900" href="/">
          BoilerSub
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            className={
              isExplore
                ? "border-b-2 border-blue-600 font-display font-bold tracking-tight text-blue-600"
                : "font-display font-medium tracking-tight text-stone-600 transition-colors duration-300 hover:text-blue-500"
            }
            href="/"
          >
            Explore
          </Link>
          <Link
            className={
              isListings
                ? "border-b-2 border-blue-600 font-display font-bold tracking-tight text-blue-600"
                : "font-display font-medium tracking-tight text-stone-600 transition-colors duration-300 hover:text-blue-500"
            }
            href="/listings"
          >
            Listings
          </Link>
          <Link
            className={
              isSublease
                ? "border-b-2 border-blue-600 font-display font-bold tracking-tight text-blue-600"
                : "font-display font-medium tracking-tight text-stone-600 transition-colors duration-300 hover:text-blue-500"
            }
            href="/listings/new"
          >
            Sublease
          </Link>
          <Link
            className="font-display font-medium tracking-tight text-stone-600 transition-colors duration-300 hover:text-blue-500"
            href="/#selection"
          >
            Guide
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                className="font-display font-bold text-stone-600 transition-all hover:text-blue-500"
                href="/profile"
              >
                {user.full_name ?? "Profile"}
              </Link>
              <button
                className="rounded-lg bg-[#0052d0] px-6 py-2.5 font-display font-bold text-[#f1f2ff] shadow-lg transition-all hover:opacity-90 active:scale-95"
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <AuthLaunchLink className="font-display font-bold text-stone-600 transition-all hover:text-blue-500" href="/login">
                Sign In
              </AuthLaunchLink>
              <Link
                className="rounded-lg bg-[#0052d0] px-6 py-2.5 font-display font-bold text-[#f1f2ff] shadow-lg transition-all hover:opacity-90 active:scale-95"
                href="/listings/new"
              >
                Post Ad
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
