"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthLaunchLink } from "@/components/AuthLaunchLink";
import { useAuth } from "@/context/AuthProvider";

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isExplore = pathname === "/";
  const isListings = pathname === "/listings" || pathname.startsWith("/listings/");
  const isAbout = pathname === "/about";

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full bg-stone-50/70 shadow-[0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <div className="grid max-w-full grid-cols-[auto_1fr_auto] items-center gap-6 px-8 py-4">
        <Link className="justify-self-start font-display text-2xl font-black tracking-tighter text-stone-900" href="/">
          BoilerSub
        </Link>

        <nav className="hidden items-center justify-center gap-8 md:flex">
          <Link
            className={
              isExplore
                ? "border-b-2 border-blue-600 font-display font-bold tracking-tight text-blue-600"
                : "font-display font-medium tracking-tight text-stone-600 transition-colors duration-300 hover:text-blue-500"
            }
            href="/"
          >
            Explain
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
              isAbout
                ? "border-b-2 border-blue-600 font-display font-bold tracking-tight text-blue-600"
                : "font-display font-medium tracking-tight text-stone-600 transition-colors duration-300 hover:text-blue-500"
            }
            href="/about"
          >
            About
          </Link>
        </nav>

        <div className="flex w-[180px] items-center justify-end gap-3 justify-self-end">
          {user ? (
            <div
              ref={menuRef}
              className="relative"
              onMouseEnter={() => setMenuOpen(true)}
            >
              <button
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Open profile menu"
                className="block transition-transform hover:scale-[1.03] active:scale-95"
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#c3d0ff] bg-[#e4e2e1] shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
                  <Image
                    alt={user.full_name ?? user.email}
                    className="object-cover"
                    fill
                    sizes="40px"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDaSnqTEKQsTs52N4G1oYeTM-0SLEdY1p5R-md48HgFy1yEVAbhas0lWx6Ddb6zwr0M8zjj8jds-JypN1ha69cQLp45rYkr2GaC1dRWjcIdhitOnibWmTvyUG3-sQMQMdRuljLqAjUb098z8Nxm25gQXq_U3eTDP71qSv1fK1mCfZXuuhwdmE0YRnGWc4HbGTDWya9Dfgo2lRuJ-84ZITlsIrM_xACKqGb6ibPATf0iS9dTER1PMDDBVgFfr-QJRNiJjzeccu9R_7q"
                  />
                </div>
              </button>

              <div
                className={
                  menuOpen
                    ? "absolute right-0 top-[calc(100%+0.75rem)] w-56 overflow-hidden rounded-2xl border border-[#d9c08a] bg-[#171412] shadow-[0_18px_48px_rgba(0,0,0,0.18)]"
                    : "pointer-events-none absolute right-0 top-[calc(100%+0.75rem)] w-56 overflow-hidden rounded-2xl border border-[#d9c08a] bg-[#171412] opacity-0 shadow-[0_18px_48px_rgba(0,0,0,0.18)]"
                }
                role="menu"
              >
                <div className="border-b border-[#8d7440]/40 px-5 py-4">
                  <p className="font-display text-sm font-bold tracking-[0.16em] text-[#d9c08a]">BoilerSub</p>
                  <p className="mt-1 truncate text-sm text-[#f6efe1]/80">{user.full_name ?? user.email}</p>
                </div>
                <div className="flex flex-col py-2">
                  <Link
                    className="px-5 py-3 font-display text-sm font-semibold tracking-tight text-[#f6efe1] transition-colors hover:bg-[#2a221c] hover:text-[#d9c08a]"
                    href="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    className="px-5 py-3 font-display text-sm font-semibold tracking-tight text-[#f6efe1] transition-colors hover:bg-[#2a221c] hover:text-[#d9c08a]"
                    href="/profile/listings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Listings
                  </Link>
                  <button
                    className="px-5 py-3 text-left font-display text-sm font-semibold tracking-tight text-[#f6efe1] transition-colors hover:bg-[#2a221c] hover:text-[#d9c08a]"
                    role="menuitem"
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false);
                      await logout();
                      router.push("/");
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
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
