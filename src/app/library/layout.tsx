import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isLibraryGateEnabled } from "@/lib/auth";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader active="Library" showLogout={isLibraryGateEnabled()} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
