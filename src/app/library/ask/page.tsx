import type { Metadata } from "next";
import Link from "next/link";
import { BrainAskForm } from "@/components/BrainAskForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ask the library",
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

export default function LibraryAskPage() {
  return (
    <section className="bg-sage py-16 md:py-20">
      <div className="container-site max-w-3xl space-y-8">
        <div>
          <Link
            href="/library"
            className="text-[0.75rem] font-semibold tracking-[0.12em] text-gold uppercase"
          >
            ← Back to the shelves
          </Link>
          <p className="section-label mt-6">Internal · CoS</p>
          <h1 className="font-display text-4xl text-charcoal md:text-5xl">
            Ask a question.
            <br />
            <em className="text-emerald italic">Get the clip.</em>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate">
            Cite-only answers from hybrid library search. The synthesis may only restate retrieved
            transcript text. This page is unlisted and noindexed — not a public chatbot.
          </p>
        </div>
        <BrainAskForm />
      </div>
    </section>
  );
}
