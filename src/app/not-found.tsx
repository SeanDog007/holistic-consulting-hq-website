import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader active="" />
      <main className="flex-1 bg-cream py-24">
        <div className="container-site max-w-xl">
          <span className="section-label">Holistic Consulting Institute</span>
          <div className="gold-line" />
          <h1 className="font-display text-5xl text-charcoal">This page is not on the site.</h1>
          <p className="mt-4 text-sm leading-7 text-slate">
            That address may have changed. You can return home, explore the residency
            programs, or read real practitioner stories.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/" className="btn-primary">
              Institute home
            </Link>
            <Link href="/programs" className="btn-outline">
              Programs
            </Link>
            <Link href="/results" className="btn-outline">
              Results
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
