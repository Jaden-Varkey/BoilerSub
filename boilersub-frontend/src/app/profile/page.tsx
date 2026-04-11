"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toast } from "@/components/Toast";
import { VerificationBadge } from "@/components/VerificationBadge";
import { useAuth } from "@/context/AuthProvider";
import { apiClient } from "@/lib/apiClient";

export default function ProfilePage() {
  const { user, refresh, logout } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setFullName(user?.full_name ?? "");
    setBio(user?.bio ?? "");
  }, [user?.bio, user?.full_name]);

  return (
    <ProtectedRoute requireVerified>
      <main className="page-wrap py-12">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="panel p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-brand-blue text-3xl font-bold text-white">
                {(user?.full_name ?? user?.email ?? "B").charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-display text-4xl">{user?.full_name ?? "Your profile"}</h1>
                <p className="mt-2 text-sm text-slate-600">{user?.email}</p>
                <div className="mt-3">
                  <VerificationBadge verified={Boolean(user?.fully_verified)} />
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <p>Phone: {user?.phone ?? "Not set"}</p>
              <p>Email verified: {user?.email_verified ? "Yes" : "No"}</p>
              <p>Phone verified: {user?.phone_verified ? "Yes" : "No"}</p>
            </div>
          </aside>

          <section className="panel p-8">
            <p className="eyebrow">Edit profile</p>
            <h2 className="mt-3 font-display text-3xl">Keep your public identity current</h2>
            <form
              className="mt-6 space-y-5"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await apiClient.users.updateMe({ full_name: fullName || null, bio: bio || null });
                  await refresh();
                  setMessage({ kind: "success", text: "Profile updated." });
                } catch (error) {
                  setMessage({ kind: "error", text: error instanceof Error ? error.message : "Failed to update profile" });
                }
              }}
            >
              {message && <Toast kind={message.kind} message={message.text} />}
              <div>
                <label className="label" htmlFor="full_name">
                  Full name
                </label>
                <Input id="full_name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="bio">
                  Bio
                </label>
                <Textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit">Save Changes</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    await logout();
                    window.location.href = "/login";
                  }}
                >
                  Log Out
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
