"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";
import { Toast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthProvider";
import { completeAuthFlow } from "@/lib/authPopup";

export default function VerifyPhoneCodePage() {
  const { setSession } = useAuth();
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPhone(window.sessionStorage.getItem("bs_pending_phone") ?? "");
  }, []);

  return (
    <main className="page-wrap py-16">
      <div className="mx-auto max-w-xl panel p-8 sm:p-10">
        <p className="eyebrow">Phone OTP</p>
        <h1 className="mt-3 font-display text-4xl">Enter the SMS code</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">{phone || "A pending phone number"} is waiting for verification.</p>
        <form
          className="mt-8 space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setMessage(null);
            try {
              const result = await apiClient.auth.verifyPhone(phone, token);
              setSession(result.session, result.user);
              completeAuthFlow("/");
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
            {busy ? "Verifying…" : "Verify Phone"}
          </Button>
        </form>
      </div>
    </main>
  );
}
