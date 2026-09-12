import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isLibraryGateEnabled } from "@/lib/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader active="Library" showLogout={isLibraryGateEnabled()} />
      <main className="flex-1 bg-cream">{children}</main>
      <SiteFooter />
    </>
  );
}
