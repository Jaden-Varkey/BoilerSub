"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Toast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";
import { normalizePhone, US_PHONE_REGEX } from "@/lib/validators";

export default function VerifyPhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <main className="page-wrap py-16">
      <div className="mx-auto max-w-xl panel p-8 sm:p-10">
        <p className="eyebrow">Phone verification</p>
        <h1 className="mt-3 font-display text-4xl">Send the SMS code</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Demo mode usually skips this stage. If you disable the demo flag later, this page is already wired to the backend.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const normalized = normalizePhone(phone);
            if (!US_PHONE_REGEX.test(normalized)) {
              setMessage("Enter a valid US number in +1 format.");
              return;
            }

            setBusy(true);
            setMessage(null);
            try {
              await apiClient.auth.sendPhoneOtp(normalized);
              window.sessionStorage.setItem("bs_pending_phone", normalized);
              router.push("/verify-phone/code");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Failed to send code");
            } finally {
              setBusy(false);
            }
          }}
        >
          {message && <Toast kind="error" message={message} />}
          <div>
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 765..." />
          </div>
          <Button className="w-full" disabled={busy} type="submit">
            {busy ? "Sending…" : "Send Code"}
          </Button>
        </form>
      </div>
    </main>
  );
}
