"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import PasswordStrengthBar from "react-password-strength-bar";
import { Toast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = useMemo(() => params.get("email") ?? "", [params]);
  const tokenHash = useMemo(() => params.get("token_hash") ?? params.get("token") ?? "", [params]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-14">
      <section className="w-full rounded-3xl border border-[#e4e2e1] bg-[#f9f6f5]/90 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:p-12">
        <Link className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#5c5b5b] hover:text-[#0052d0]" href="/login">
          ← Back to Log In
        </Link>

        <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight text-[#2f2f2e] md:text-5xl">
          Set your new password
        </h1>
        <p className="mt-3 text-[#5c5b5b]">
          {email ? `Resetting password for ${email}` : "Create a new password for your account."}
        </p>

        <form
          className="mt-10 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(null);
            setSuccessMessage(null);

            if (password.length < 8) {
              setMessage("Password must be at least 8 characters.");
              return;
            }

            if (password !== confirm) {
              setMessage("Passwords do not match.");
              return;
            }

            if (!tokenHash) {
              setMessage("Invalid or expired reset link. Request a new one from Forgot Password.");
              return;
            }

            setBusy(true);
            void apiClient.auth
              .resetPassword(tokenHash, password, confirm)
              .then(() => {
                setSuccessMessage("Password updated. Redirecting to login...");
                window.setTimeout(() => {
                  router.push("/login");
                }, 800);
              })
              .catch((error) => {
                setMessage(error instanceof Error ? error.message : "Unable to reset password");
              })
              .finally(() => {
                setBusy(false);
              });
          }}
        >
          {message && <Toast kind="error" message={message} />}
          {successMessage && <Toast kind="success" message={successMessage} />}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#6a5a32]" htmlFor="password">
              New Password
            </label>
            <div className="relative">
              <input
                className="w-full rounded-xl border-0 bg-[#dfdcdc] px-5 py-4 pr-16 text-[#2f2f2e] placeholder:text-[#787676] focus:ring-2 focus:ring-[#0052d0] focus:ring-offset-2"
                id="password"
                name="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5c5b5b] hover:text-[#2f2f2e]"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <PasswordStrengthBar
              password={password}
              minLength={8}
              shortScoreWord="Too short"
              scoreWords={["Weak", "Fair", "Good", "Strong", "Very strong"]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#6a5a32]" htmlFor="confirm">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                className="w-full rounded-xl border-0 bg-[#dfdcdc] px-5 py-4 pr-16 text-[#2f2f2e] placeholder:text-[#787676] focus:ring-2 focus:ring-[#0052d0] focus:ring-offset-2"
                id="confirm"
                name="confirm"
                placeholder="••••••••"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
              />
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5c5b5b] hover:text-[#2f2f2e]"
                type="button"
                onClick={() => setShowConfirm((value) => !value)}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-[#f3f0ef] p-4 text-sm text-[#5c5b5b]">
            Password must be at least 8 characters and should include letters and numbers.
          </div>

          <button
            className="w-full rounded-xl bg-[#0052d0] py-4 font-display text-lg font-bold text-[#f1f2ff] shadow-[0px_12px_32px_rgba(0,82,208,0.2)] transition-all hover:bg-[#0047b7] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? "Updating Password…" : "Update Password"}
          </button>
        </form>
      </section>
    </main>
  );
}
