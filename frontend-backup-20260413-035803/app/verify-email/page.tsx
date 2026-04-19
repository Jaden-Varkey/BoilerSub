"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";
import { Toast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthProvider";
import { completeAuthFlow } from "@/lib/authPopup";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setEmail(window.sessionStorage.getItem("bs_pending_email") ?? "");
  }, []);

  useEffect(() => {
    if (!cooldown) {
      return;
    }
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  return (
    <main className="page-wrap py-16">
      <div className="mx-auto max-w-xl panel p-8 sm:p-10">
        <p className="eyebrow">Email verification</p>
        <h1 className="mt-3 font-display text-4xl">Enter the 6-digit code</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          We sent the code to <span className="font-semibold text-slate-900">{email || "your Purdue inbox"}</span>.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (token.length !== 6) {
              setMessage("Enter the full 6-digit code.");
              return;
            }

            setBusy(true);
            setMessage(null);
            try {
              const result = await apiClient.auth.verifyEmail(email, token);
              if ("session" in result && result.session?.access_token) {
                setSession(result.session, result.user);
                completeAuthFlow("/");
                return;
              }
              router.push("/verify-phone");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Verification failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          {message && <Toast kind="error" message={message} />}
          <OtpInput value={token} onChange={setToken} />
          <Button className="w-full" disabled={busy} type="submit">
            {busy ? "Verifying…" : "Verify Email"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-600">
          <span>Didn&apos;t get it?</span>
          <Button
            variant="secondary"
            disabled={cooldown > 0 || !email}
            onClick={async () => {
              try {
                await apiClient.auth.resendEmailOtp(email);
                setCooldown(30);
                setMessage("A fresh code is on the way.");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Resend failed");
              }
            }}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
          </Button>
        </div>
      </div>
    </main>
  );
}
