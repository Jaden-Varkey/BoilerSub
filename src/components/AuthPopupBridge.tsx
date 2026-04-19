"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { AUTH_COMPLETE_EVENT } from "@/lib/authPopup";

export function AuthPopupBridge() {
  const router = useRouter();
  const { refresh } = useAuth();

  useEffect(() => {
    const syncAuth = () => {
      void refresh().finally(() => {
        router.refresh();
      });
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "bs_auth_event") {
        syncAuth();
      }
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === AUTH_COMPLETE_EVENT) {
        syncAuth();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("message", onMessage);
    };
  }, [refresh, router]);

  return null;
}
