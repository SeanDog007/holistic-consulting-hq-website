import { Suspense } from "react";
import { BotanicalMotif } from "@/components/BotanicalMotif";
import { LoginForm } from "@/components/LoginForm";

export const metadata = {
  title: "Member sign in",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LibraryLoginPage() {
  return (
    <section className="grid min-h-[78vh] grid-cols-1 lg:grid-cols-2">
      <div className="relative flex items-center overflow-hidden bg-cream py-16">
        <BotanicalMotif className="pointer-events-none absolute -bottom-16 -left-8 h-64 w-64 text-emerald/10" />
        <div className="container-site relative max-w-xl">
          <Suspense fallback={<p className="text-slate">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden bg-emerald lg:flex">
        <BotanicalMotif className="pointer-events-none absolute -right-6 -bottom-8 h-72 w-72 text-white/10" />
        <blockquote className="relative z-10 mx-12 max-w-sm bg-white/10 px-8 py-10 font-display text-3xl leading-snug text-cream italic">
          “School teaches you what to know. A mentorship teaches you how to practice — and gives
          you the people to practice it with.”
          <footer className="mt-8 font-sans text-[0.7rem] font-semibold tracking-[0.16em] text-gold not-italic uppercase">
            Holistic Consulting Institute
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
