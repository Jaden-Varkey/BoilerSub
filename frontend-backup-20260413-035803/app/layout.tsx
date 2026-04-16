import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthProvider";
import { AppChrome } from "@/components/AppChrome";
import { AuthPopupBridge } from "@/components/AuthPopupBridge";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "BoilerSub",
  description: "Purdue-only subleasing marketplace",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-brand-sand text-brand-ink antialiased">
        <AuthProvider>
          <div className="relative min-h-screen">
            <div className="fixed inset-0 -z-10 bg-kinetic-grid bg-[size:38px_38px] opacity-20" />
            <AuthPopupBridge />
            <AppChrome>{children}</AppChrome>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
