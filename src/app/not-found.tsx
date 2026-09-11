import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-warm-gray py-24">
        <div className="container-site max-w-xl">
          <span className="section-label">Not found</span>
          <div className="gold-line" />
          <h1 className="font-display text-5xl text-charcoal">This page is not on the shelf.</h1>
          <p className="mt-4 text-sm leading-7 text-slate">
            The address may have changed, or the recording is no longer in the library.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/library" className="btn-primary">
              Recording library
            </Link>
            <Link href="/index.html" className="btn-outline">
              Institute home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
