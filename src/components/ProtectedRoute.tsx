"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";

function pendingRoute(emailVerified: boolean, phoneVerified: boolean) {
  if (!emailVerified) {
    return "/verify-email";
  }
  if (!phoneVerified) {
    return "/verify-phone";
  }
  return "/verify-email";
}

export function ProtectedRoute({
  children,
  requireVerified = false,
}: {
  children: React.ReactNode;
  requireVerified?: boolean;
}) {
  const router = useRouter();
  const { status, user, isFullyVerified } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (requireVerified && user && !isFullyVerified) {
      router.push(pendingRoute(user.email_verified, user.phone_verified));
    }
  }, [isFullyVerified, requireVerified, router, status, user]);

  if (status === "loading") {
    return <div className="page-wrap py-24 text-sm text-slate-600">Loading…</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (requireVerified && user && !isFullyVerified) {
    return null;
  }

  return <>{children}</>;
}
