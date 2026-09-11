import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const metadata = {
  title: "Member sign in",
};

export default function LibraryLoginPage() {
  return (
    <section className="grid min-h-[70vh] grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center bg-warm-gray py-16">
        <div className="container-site max-w-xl">
          <Suspense fallback={<div className="border border-line bg-white p-10">Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden bg-emerald lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,150,59,0.18),transparent_50%)]" />
        <blockquote className="relative z-10 max-w-sm px-10 font-display text-3xl leading-snug text-white italic">
          “School teaches you what to know. A mentorship teaches you how to practice — and gives
          you the people to practice it with.”
          <footer className="mt-6 font-sans text-[0.7rem] font-semibold tracking-[0.14em] text-gold not-italic uppercase">
            Holistic Consulting Institute
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
