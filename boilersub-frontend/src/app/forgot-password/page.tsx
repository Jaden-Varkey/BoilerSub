"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Toast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";
import { PURDUE_EMAIL_REGEX } from "@/lib/validators";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden font-body text-[#2f2f2e] md:flex-row">
      <section className="relative hidden min-h-screen w-[45%] overflow-hidden bg-[#5e4e27] md:block">
        <Image
          alt="Purdue campus architecture"
          className="object-cover opacity-45 grayscale-[0.35]"
          fill
          priority
          sizes="45vw"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhmU4eDsDdYDgpT1EE24gtb0EGOXYUeMNtVN7DhzzMYJNEXlaQ5dJmn9eziG_tYlyr6RFEkuH53knzgRw3Df_vGTR7lXC-7kayRZd07eKZmQHggId9A2ev1WmhwheDZp12keEfZvz169QxRJ8eIiED11BeJR1jczjiCbXXH0hMnI_C583fDnrBhL2i_LtC_0pRScrL2PCY_RMpAC_Zh7fzDHtxbb4VXyFc6dYhXQiUteSKtET-4mNThYaav7fTHpgftOalDqaq1KpH"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#5e4e27]/95 via-[#6a5a32]/70 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end p-14 text-[#fff1d9]">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#fee6b2]">Verified Secure</p>
          <h1 className="font-display text-6xl font-extrabold leading-[1.05] tracking-tighter">Reset access.</h1>
          <p className="mt-6 max-w-md text-lg text-[#fee6b2]/90">
            We&apos;ll send a reset link to your Purdue email so you can set a new password securely.
          </p>
        </div>
      </section>

      <section className="flex w-full items-center justify-center p-6 md:w-[55%] md:p-14 lg:p-24">
        <div className="w-full max-w-lg">
          <Link className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#5c5b5b] hover:text-[#0052d0]" href="/login">
            ← Back to Log In
          </Link>

          <h2 className="font-display text-4xl font-extrabold tracking-tight text-[#2f2f2e] md:text-5xl">
            Reset your BoilerSub password
          </h2>
          <p className="mt-3 text-lg text-[#5c5b5b]">Enter your Purdue email to receive a reset link.</p>

          <form
            className="mt-10 space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(null);
              setSuccessMessage(null);

              if (!PURDUE_EMAIL_REGEX.test(email)) {
                setMessage("Please use your @purdue.edu email.");
                return;
              }

              setBusy(true);
              const normalizedEmail = email.trim().toLowerCase();
              const redirectTo = `${window.location.origin}/reset-password`;
              void apiClient.auth
                .requestPasswordReset(normalizedEmail, redirectTo)
                .then(() => {
                  setSuccessMessage("Reset link sent. Check your Purdue inbox.");
                })
                .catch((error) => {
                  setMessage(error instanceof Error ? error.message : "Unable to send reset link");
                })
                .finally(() => {
                  setBusy(false);
                });
            }}
          >
            {message && <Toast kind="error" message={message} />}
            {successMessage && <Toast kind="success" message={successMessage} />}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#6a5a32]" htmlFor="email">
                Purdue Email Address
              </label>
              <input
                className="w-full rounded-xl border-0 bg-[#dfdcdc] px-5 py-4 text-[#2f2f2e] placeholder:text-[#787676] focus:ring-2 focus:ring-[#0052d0] focus:ring-offset-2"
                id="email"
                name="email"
                placeholder="username@purdue.edu"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <button
              className="w-full rounded-xl bg-[#0052d0] py-4 font-display text-lg font-bold text-[#f1f2ff] shadow-[0px_12px_32px_rgba(0,82,208,0.2)] transition-all hover:bg-[#0047b7] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              {busy ? "Sending Link…" : "Send Reset Link"}
            </button>

            <p className="text-sm text-[#5c5b5b]">
              Need an account?
              <Link className="ml-1 font-bold text-[#0052d0] hover:underline" href="/signup">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
