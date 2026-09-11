import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-charcoal pt-16 pb-8 text-white">
      <div className="container-site">
        <div className="mb-8 grid grid-cols-1 gap-12 border-b border-white/8 pb-12 md:grid-cols-4">
          <div>
            <div className="font-display text-2xl font-bold">Holistic Consulting</div>
            <span className="mt-1 mb-5 block text-[0.6rem] tracking-[0.18em] text-gold uppercase">
              Impactful Careers
            </span>
            <p className="max-w-[260px] text-[0.83rem] leading-7 text-white/40">
              Advanced, evidence-informed education in functional nutrition, herbalism, and
              professional practice — for practitioners who want to practice with clarity,
              competence, and impact.
            </p>
          </div>
          <div>
            <h4 className="mb-5 text-[0.65rem] font-bold tracking-[0.18em] text-white/40 uppercase">
              Programs
            </h4>
            <ul className="space-y-2.5 text-[0.85rem] text-white/60">
              <li>
                <Link href="/programs.html" className="hover:text-white">
                  Mentorship
                </Link>
              </li>
              <li>
                <Link href="/programs.html" className="hover:text-white">
                  Herbalism
                </Link>
              </li>
              <li>
                <Link href="/programs.html" className="hover:text-white">
                  BCHN Exam Prep
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-white">
                  Recording Library
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-[0.65rem] font-bold tracking-[0.18em] text-white/40 uppercase">
              Institute
            </h4>
            <ul className="space-y-2.5 text-[0.85rem] text-white/60">
              <li>
                <Link href="/about.html" className="hover:text-white">
                  About & Mission
                </Link>
              </li>
              <li>
                <Link href="/results.html" className="hover:text-white">
                  Results & Testimonials
                </Link>
              </li>
              <li>
                <Link href="/blog.html" className="hover:text-white">
                  Blog & Resources
                </Link>
              </li>
              <li>
                <Link href="/faq.html" className="hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-[0.65rem] font-bold tracking-[0.18em] text-white/40 uppercase">
              Get Started
            </h4>
            <ul className="space-y-2.5 text-[0.85rem] text-white/60">
              <li>
                <Link href="/enroll.html" className="hover:text-white">
                  Book a Discovery Call
                </Link>
              </li>
              <li>
                <Link href="/library/login" className="hover:text-white">
                  Member library sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 text-[0.75rem] text-white/25 sm:flex-row">
          <p>© {new Date().getFullYear()} Holistic Consulting Institute. All rights reserved.</p>
          <p>Built with care for practitioners who care.</p>
        </div>
      </div>
    </footer>
  );
}
