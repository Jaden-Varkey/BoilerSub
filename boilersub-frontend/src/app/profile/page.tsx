"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthProvider";
import { apiClient } from "@/lib/apiClient";

function splitName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  const value = fullName?.trim() ?? "";
  if (!value) {
    return { firstName: "", lastName: "" };
  }
  const parts = value.split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export default function ProfilePage() {
  const { user, refresh, logout } = useAuth();
  const initialName = splitName(user?.full_name);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [bio, setBio] = useState(user?.bio ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const nextName = splitName(user?.full_name);
    setFirstName(nextName.firstName);
    setLastName(nextName.lastName);
    setBio(user?.bio ?? "");
  }, [user?.bio, user?.full_name]);

  return (
    <ProtectedRoute requireVerified>
      <main className="mx-auto max-w-screen-2xl px-6 pb-24 pt-28">
        <header className="mb-12">
          <h1 className="font-display text-6xl font-black tracking-tighter text-[#2f2f2e]">My Profile</h1>
          <p className="mt-2 text-lg text-[#5c5b5b]">Manage your Boilermaker identity and listings.</p>
        </header>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="space-y-8 md:col-span-8">
            <section className="relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-[0px_12px_32px_rgba(0,0,0,0.04)]">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#6a5a32]/5 blur-3xl" />
              <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:items-start">
                <div className="relative">
                  <Image
                    alt={user?.full_name ?? user?.email ?? "Profile avatar"}
                    className="h-40 w-40 rounded-[2.5rem] object-cover shadow-xl"
                    height={160}
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCHJpE5p1_29TQDg4BICkX9VjBGcxiqPZJ_XGa_zp5QYrx1g1Vza-z_nNb0cB5BuwrDTY2ETh9uCEnDXqSYKoG2e-5C2KXWQVCeqRM99j-y-FjP4yIit3EHn3DwzaZVx19_q5hdNImeEXZwa6aB-pQExNqS_7AQ6VdoqymXh7hwu2vHJEDK1onPT3B-5YBTZ7-88mmY7TgCfOdfMofSdOphRB-jnyirdcMyu7Gqh_qn4b6M5v1NrrflUvnN6G2kkVsSdukWxx1TeNQ"
                    width={160}
                  />
                  <div className="absolute -bottom-2 -right-2 rounded-2xl bg-white p-2 shadow-lg">
                    <span className="text-2xl text-[#0052d0]">✓</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
                    <h2 className="font-display text-4xl font-bold">{user?.full_name ?? "Your Profile"}</h2>
                    <span className="inline-flex items-center rounded-full bg-[#fee6b2] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#64532c]">
                      Verified Purdue Student
                    </span>
                  </div>
                  <p className="text-sm text-[#5c5b5b]">{user?.email}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                    <span className="flex items-center gap-2 rounded-full bg-[#e4e2e1] px-4 py-2 text-xs font-bold">
                      <span className="text-[#0052d0]">✓</span>
                      Email Verified
                    </span>
                    <span className="flex items-center gap-2 rounded-full bg-[#e4e2e1] px-4 py-2 text-xs font-bold">
                      <span className="text-[#0052d0]">✓</span>
                      Phone Verified
                    </span>
                    <span className="flex items-center gap-2 rounded-full bg-[#ff946e] px-4 py-2 text-xs font-bold text-[#5c1a00]">
                      <span>✦</span>
                      Fully Verified
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-6 rounded-[2rem] bg-[#f3f0ef] p-8">
                <h3 className="mb-4 font-display text-lg font-bold">Security & Verification</h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">Purdue Email</label>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#2f2f2e]">{user?.email}</span>
                      <span className="text-[#0052d0]">🔒</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">Mobile Number</label>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#2f2f2e]">{user?.phone ?? "Not set"}</span>
                      <span className="text-[#0052d0]">✓</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-[2rem] bg-[#f3f0ef] p-8">
                <div>
                  <h3 className="mb-2 font-display text-lg font-bold">Marketplace Activity</h3>
                  <p className="text-sm text-[#5c5b5b]">Your current presence on BoilerSub.</p>
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-6xl font-black text-[#6a5a32]">02</span>
                  <span className="font-bold uppercase tracking-tight text-[#5c5b5b]">Active Listings</span>
                </div>
              </div>
            </div>

            <section className="space-y-8 rounded-[2rem] bg-[#f3f0ef] p-8">
              <h3 className="font-display text-lg font-bold">Profile Details</h3>
              <form
                className="space-y-6"
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    const fullName = joinName(firstName, lastName);
                    await apiClient.users.updateMe({ full_name: fullName || null, bio: bio || null });
                    await refresh();
                    setMessage({ kind: "success", text: "Profile updated." });
                  } catch (error) {
                    setMessage({ kind: "error", text: error instanceof Error ? error.message : "Failed to update profile" });
                  }
                }}
              >
                {message && <Toast kind={message.kind} message={message.text} />}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="group">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">First Name</label>
                    <input
                      className="w-full rounded-xl border-none bg-[#dfdcdc] px-6 py-4 font-medium focus:ring-2 focus:ring-[#0052d0]/20"
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                    />
                  </div>
                  <div className="group">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">Last Name</label>
                    <input
                      className="w-full rounded-xl border-none bg-[#dfdcdc] px-6 py-4 font-medium focus:ring-2 focus:ring-[#0052d0]/20"
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">Bio</label>
                  <textarea
                    className="w-full resize-none rounded-xl border-none bg-[#dfdcdc] px-6 py-4 font-medium focus:ring-2 focus:ring-[#0052d0]/20"
                    rows={4}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </div>
                <div className="pt-4">
                  <button className="flex items-center gap-3 rounded-xl bg-[#0052d0] px-8 py-4 font-bold text-[#f1f2ff] shadow-lg shadow-[#0052d0]/20 transition-all hover:bg-[#0047b7]">
                    <span>Save Changes</span>
                    <span>💾</span>
                  </button>
                </div>
              </form>
            </section>

            <section className="space-y-8 rounded-[2rem] bg-[#f3f0ef] p-8">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">Change Password</h3>
                  <p className="text-sm text-[#5c5b5b]">Confirm your current password, then choose a new one with at least 8 characters.</p>
                </div>
              </div>
              <form
                className="space-y-6"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setPasswordMessage(null);

                  if (newPassword.length < 8) {
                    setPasswordMessage({ kind: "error", text: "New password must be at least 8 characters." });
                    return;
                  }

                  if (newPassword !== confirmPassword) {
                    setPasswordMessage({ kind: "error", text: "New passwords do not match." });
                    return;
                  }

                  if (currentPassword === newPassword) {
                    setPasswordMessage({ kind: "error", text: "New password must be different from your current password." });
                    return;
                  }

                  try {
                    await apiClient.auth.changePassword(currentPassword, newPassword, confirmPassword);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordMessage({ kind: "success", text: "Password updated." });
                  } catch (error) {
                    setPasswordMessage({ kind: "error", text: error instanceof Error ? error.message : "Failed to update password" });
                  }
                }}
              >
                {passwordMessage && <Toast kind={passwordMessage.kind} message={passwordMessage.text} />}
                <div className="group">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">Current Password</label>
                  <input
                    className="w-full rounded-xl border-none bg-[#dfdcdc] px-6 py-4 font-medium focus:ring-2 focus:ring-[#0052d0]/20"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="group">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">New Password</label>
                    <input
                      className="w-full rounded-xl border-none bg-[#dfdcdc] px-6 py-4 font-medium focus:ring-2 focus:ring-[#0052d0]/20"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </div>
                  <div className="group">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">Confirm New Password</label>
                    <input
                      className="w-full rounded-xl border-none bg-[#dfdcdc] px-6 py-4 font-medium focus:ring-2 focus:ring-[#0052d0]/20"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button className="flex items-center gap-3 rounded-xl bg-[#2f2f2e] px-8 py-4 font-bold text-[#f9f7f3] shadow-lg transition-all hover:bg-[#171717]">
                    <span>Update Password</span>
                    <span>🔐</span>
                  </button>
                </div>
              </form>
            </section>
          </div>

          <aside className="space-y-6 md:col-span-4">
            <div className="rounded-[2rem] border border-[#6a5a32]/10 bg-[#6a5a32]/5 p-8">
              <div className="text-4xl text-[#6a5a32]">🛡</div>
              <h4 className="mb-2 mt-4 font-display text-xl font-bold text-[#6a5a32]">Boiler Trust</h4>
              <p className="text-sm leading-relaxed text-[#5c5b5b]">
                Verified BoilerSub members build trust faster and receive more inquiries on their subleases. Keep your profile updated to maintain your student status.
              </p>
            </div>

            <div className="space-y-2 rounded-[2rem] bg-[#f3f0ef] p-5">
              <Link className="group flex items-center gap-4 rounded-2xl p-4 text-[#2f2f2e] transition-all hover:bg-[#e4e2e1]" href="/profile/listings">
                <span className="text-[#0052d0]">☰</span>
                <span className="font-bold">My Listings</span>
                <span className="ml-auto text-sm opacity-30">›</span>
              </Link>
              <button className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left text-[#2f2f2e] transition-all hover:bg-[#e4e2e1]">
                <span className="text-[#0052d0]">⚙</span>
                <span className="font-bold">Account Settings</span>
                <span className="ml-auto text-sm opacity-30">›</span>
              </button>
              <div className="mx-4 my-1 h-px bg-[#dfdcdc]" />
              <button
                className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left text-[#b02500] transition-all hover:bg-[#f95630]/10"
                onClick={async () => {
                  await logout();
                  window.location.href = "/";
                }}
              >
                <span>↩</span>
                <span className="font-bold">Log Out</span>
              </button>
            </div>

            <div className="rounded-[2rem] bg-[#c3d0ff]/30 p-8">
              <h5 className="mb-2 font-bold">Need help?</h5>
              <p className="mb-4 text-sm text-[#5c5b5b]">Our support team is available for students 24/7.</p>
              <button className="flex items-center gap-2 text-sm font-bold text-[#0052d0] hover:underline">
                Contact Support <span>↗</span>
              </button>
            </div>
          </aside>
        </div>
      </main>
    </ProtectedRoute>
  );
}
