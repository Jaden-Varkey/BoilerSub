"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type AuthLaunchLinkProps = {
  href: "/login" | "/signup";
  className?: string;
  children: ReactNode;
};

export function AuthLaunchLink({ href, className, children }: AuthLaunchLinkProps) {
  return (
    <Link
      className={className}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        window.open(href, "_blank", "popup=false");
      }}
    >
      {children}
    </Link>
  );
}
