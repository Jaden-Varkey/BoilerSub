"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/Nav";
import { SiteFooter } from "@/components/SiteFooter";

const AUTH_ROUTES = ["/login", "/signup", "/verify-email", "/verify-phone", "/forgot-password", "/reset-password", "/capture-images"];

function shouldHideChrome(pathname: string) {
  return (
    AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  );
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = shouldHideChrome(pathname);

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Nav />
      {children}
      <SiteFooter />
    </>
  );
}
