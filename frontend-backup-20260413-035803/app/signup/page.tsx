"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Toast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";
import { PURDUE_EMAIL_REGEX } from "@/lib/validators";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  return (
    <main className="flex min-h-screen flex-col text-[#2f2f2e] md:flex-row">
      <section className="relative hidden w-full items-end overflow-hidden bg-[#6a5a32] p-12 md:flex md:w-5/12 lg:p-20">
        <div className="absolute inset-0 z-0 opacity-40">
          <Image
            alt="Purdue University campus architecture with classical brick buildings and modern student pathways under a clear sky"
            className="object-cover"
            fill
            priority
            sizes="(min-width: 768px) 42vw, 0px"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJpMMDbdEFh7srZoyw782uwhL1gbQVeEAqye4OBYoikH2f5JkMGlxCnZTZYKQBU8yIz6zEWZQ1NeEcqNZBVgv6qq6BV_JSB4CwidjBcmVyOiVI_nvH1yNlYlUj8yXIgkGuFUuo8aFr1snqggnminiV-THFKdOpfhGV7119rqBZJrXHHmGKJDDEP2GSrEn2xh5LItei_g4W_zQDkbI8Q_agUJGJUPZvOC3uYigbQl3nAVsfpzja3sQqtnn8aDBT-rAyMdUQKnG0cleV"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#6a5a32] via-[#6a5a32]/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full">
          <div className="mb-12 flex items-center gap-2">
            <span className="text-3xl font-black italic tracking-tighter text-[#fff1d9]">BoilerSub</span>
          </div>
          <h2 className="mb-8 max-w-sm font-display text-5xl font-extrabold leading-tight tracking-tighter text-[#fff1d9] lg:text-7xl">
            Student <span className="font-light italic">Housing</span> Redefined.
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 rounded-xl border border-[#fff1d9]/10 bg-white/10 p-4 backdrop-blur-md transition-all hover:bg-white/20">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#fee6b2]/30 text-[#fff1d9]">
                <span>✓</span>
              </div>
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wider text-[#fff1d9]">Purdue-only access</p>
                <p className="text-xs text-[#fff1d9]/70">Exclusively for @purdue.edu emails.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-[#fff1d9]/10 bg-white/10 p-4 backdrop-blur-md transition-all hover:bg-white/20">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#fee6b2]/30 text-[#fff1d9]">
                <span>◉</span>
              </div>
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wider text-[#fff1d9]">Verified students</p>
                <p className="text-xs text-[#fff1d9]/70">Join 5,000+ Boilermakers today.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-[#fff1d9]/10 bg-white/10 p-4 backdrop-blur-md transition-all hover:bg-white/20">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#fee6b2]/30 text-[#fff1d9]">
                <span>🔒</span>
              </div>
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wider text-[#fff1d9]">
                  Secure sublease flow
                </p>
                <p className="text-xs text-[#fff1d9]/70">End-to-end encryption for every lease.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col items-center justify-center bg-transparent p-6 md:p-12 lg:p-24">
        <div className="mb-12 md:hidden">
          <span className="text-3xl font-black italic tracking-tighter text-[#6a5a32]">BoilerSub</span>
        </div>

        <div className="w-full max-w-md">
          <header className="mb-10 text-center md:text-left">
            <h1 className="mb-4 font-display text-4xl font-extrabold leading-none tracking-tighter text-[#2f2f2e] lg:text-5xl">
              Create your BoilerSub account
            </h1>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#a03a0f]/10 bg-[#ff946e]/30 px-3 py-1.5">
              <span className="text-sm text-[#a03a0f]">!</span>
              <p className="text-xs font-bold uppercase tracking-widest text-[#5c1a00]">
                @purdue.edu only access for verified Boilermakers
              </p>
            </div>
          </header>

          <form
            className="space-y-6"
            onSubmit={async (event) => {
              event.preventDefault();
              setMessage(null);

              if (!PURDUE_EMAIL_REGEX.test(email)) {
                setMessage("Use your @purdue.edu email.");
                return;
              }

              if (password.length < 8) {
                setMessage("Password must be at least 8 characters.");
                return;
              }

              if (password !== confirm) {
                setMessage("Passwords do not match.");
                return;
              }

              if (!acceptedTerms) {
                setMessage("Accept the terms to continue.");
                return;
              }

              setBusy(true);
              try {
                await apiClient.auth.signup(email, password);
                window.sessionStorage.setItem("bs_pending_email", email);
                router.push("/verify-email");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Signup failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            {message && <Toast kind="error" message={message} />}

            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6a5a32]" htmlFor="email">
                Purdue Email Address
              </label>
              <div className="group relative">
                <input
                  className="h-14 w-full rounded-xl border-0 bg-[#f3f0ef] px-5 font-body text-[#2f2f2e] placeholder:text-[#afadac] transition-all duration-300 focus:bg-[#eae7e7] focus:ring-2 focus:ring-[#0052d0]/20"
                  id="email"
                  placeholder="student@purdue.edu"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-focus-within:opacity-100">
                  <span className="text-lg text-[#0052d0]">@</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6a5a32]" htmlFor="password">
                Password
              </label>
              <div className="group relative">
                <input
                  className="h-14 w-full rounded-xl border-0 bg-[#f3f0ef] px-5 pr-12 font-body text-[#2f2f2e] placeholder:text-[#afadac] transition-all duration-300 focus:bg-[#eae7e7] focus:ring-2 focus:ring-[#0052d0]/20"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#787676] transition-colors hover:text-[#2f2f2e]"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6a5a32]" htmlFor="confirm_password">
                Confirm Password
              </label>
              <div className="group relative">
                <input
                  className="h-14 w-full rounded-xl border-0 bg-[#f3f0ef] px-5 pr-12 font-body text-[#2f2f2e] placeholder:text-[#afadac] transition-all duration-300 focus:bg-[#eae7e7] focus:ring-2 focus:ring-[#0052d0]/20"
                  id="confirm_password"
                  placeholder="••••••••"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#787676] transition-colors hover:text-[#2f2f2e]"
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
              <input
                checked={acceptedTerms}
                className="mt-1 h-5 w-5 rounded border-0 bg-[#f3f0ef] text-[#0052d0] focus:ring-[#0052d0]/20"
                id="terms"
                type="checkbox"
                onChange={(event) => setAcceptedTerms(event.target.checked)}
              />
              <label className="text-xs font-medium leading-relaxed text-[#5c5b5b]" htmlFor="terms">
                By creating an account, I agree to the{" "}
                <a className="text-[#0052d0] hover:underline" href="#">
                  Purdue Housing Guidelines
                </a>{" "}
                and{" "}
                <a className="text-[#0052d0] hover:underline" href="#">
                  Terms of Service
                </a>
                .
              </label>
            </div>

            <div className="space-y-6 pt-4">
              <button
                className="flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-[#0052d0] text-lg font-display font-bold text-[#f1f2ff] shadow-[0px_12px_32px_rgba(0,82,208,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_16px_40px_rgba(0,82,208,0.3)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
                type="submit"
              >
                {busy ? "Creating Account…" : "Create Account"}
                <span aria-hidden="true">→</span>
              </button>

              <div className="flex items-center justify-center gap-2 pt-4">
                <p className="text-sm font-medium text-[#5c5b5b]">Already have an account?</p>
                <Link className="text-sm font-bold text-[#0052d0] transition-colors hover:text-[#0047b7]" href="/login">
                  Log in
                </Link>
              </div>
            </div>
          </form>

          <footer className="mt-20 border-t border-[#e4e2e1] pt-8 text-center md:text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#787676]">
              © 2024 BoilerSub. Built for Boilermakers.
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
