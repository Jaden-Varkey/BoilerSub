"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthProvider";
import { completeAuthFlow } from "@/lib/authPopup";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden font-body text-[#2f2f2e] md:flex-row">
      <section className="relative min-h-[420px] w-full overflow-hidden bg-[#e4e2e1] md:min-h-screen md:w-[55%]">
        <div className="absolute inset-0 z-0">
          <Image
            alt="Purdue campus architecture"
            className="object-cover grayscale-[0.2] contrast-[1.1]"
            fill
            priority
            sizes="(min-width: 768px) 55vw, 100vw"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtA0jc6iTBDRHLrwQypBG6jioP_ij2z9Dy2LYUCLO48nFzrBnXEK-qpJc92fdD7TRsU4_pDbYNh-WGHcKej91oy9BgdPSPM3uoHLKwT7a1JvLRd-sFBAP3w4cUTrR_SPmexIzV3pBAn-SdL8QjWJ9ydDgyIOSwyNrZH7lgS1e5XlbgcLkF4xa0Q_WJhqKfAjcUTgD2iMa7YDQi0V7u-_RF1ofbhYRn3OLUlUxEz_eeutULZNr5QgCRZy5_fCDvE4oVreFqMt3qzcy9"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#6a5a32]/80 via-[#6a5a32]/40 to-transparent" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-end p-8 text-[#fff1d9] md:p-20">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#ff946e] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#5c1a00]">
              <span>✓</span>
              Student-Only Access
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-none tracking-tighter md:text-7xl">
              Designed for
              <br />
              <span className="text-[#fee6b2]">Boilermakers.</span>
            </h1>
            <p className="max-w-md text-lg text-[#fee6b2]/90 md:text-xl">
              Join the most trusted marketplace at Purdue. Verified community members, secure subleases, and seamless housing transitions.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="rounded-xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                <div className="mb-1 text-3xl font-display font-bold text-white">10k+</div>
                <div className="text-sm uppercase tracking-wider text-[#fee6b2]/70">Verified Students</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                <div className="mb-1 text-3xl font-display font-bold text-white">500+</div>
                <div className="text-sm uppercase tracking-wider text-[#fee6b2]/70">Active Subleases</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex w-full items-center justify-center bg-transparent p-6 md:w-[45%] md:p-12 lg:p-24">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <h2 className="mb-3 font-display text-4xl font-extrabold tracking-tight text-[#2f2f2e]">
              Welcome back to BoilerSub
            </h2>
            <p className="leading-relaxed text-[#5c5b5b]">
              Sign in to manage your listings, message potential subtenants, and secure your next home near campus.
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setMessage(null);
              try {
                await login(email, password);
                completeAuthFlow("/");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Login failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            {message && <Toast kind="error" message={message} />}

            <div className="space-y-2">
              <label className="block text-sm font-semibold uppercase tracking-widest text-[#2f2f2e]" htmlFor="email">
                Purdue Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#5c5b5b]">@</div>
                <input
                  className="block w-full rounded-xl border-none bg-[#dfdcdc] py-4 pl-12 pr-4 text-[#2f2f2e] placeholder:text-[#787676] focus:ring-2 focus:ring-[#0052d0] focus:ring-offset-2"
                  id="email"
                  name="email"
                  placeholder="example@purdue.edu"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold uppercase tracking-widest text-[#2f2f2e]" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#5c5b5b]">•</div>
                <input
                  className="block w-full rounded-xl border-none bg-[#dfdcdc] py-4 pl-12 pr-12 text-[#2f2f2e] placeholder:text-[#787676] focus:ring-2 focus:ring-[#0052d0] focus:ring-offset-2"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="absolute inset-y-0 right-0 pr-4 text-[#5c5b5b] hover:text-[#2f2f2e]"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052d0] py-5 font-display font-bold text-[#f1f2ff] shadow-[0px_12px_32px_rgba(0,82,208,0.2)] transition-all hover:bg-[#0047b7] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              {busy ? "Logging In…" : "Log In"}
              <span aria-hidden="true">→</span>
            </button>

            <div className="border-t border-[#e4e2e1] pt-8 text-center">
              <p className="text-[#5c5b5b]">
                Don&apos;t have an account?
                <Link className="ml-1 font-bold text-[#0052d0] hover:underline" href="/signup">
                  Sign up
                </Link>
              </p>
            </div>
          </form>

          <footer className="mt-16 flex flex-wrap justify-center gap-6 text-xs uppercase tracking-widest text-stone-500">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Help Center</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
