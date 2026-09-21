import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-forest-deep pt-16 pb-8 text-cream">
      <div className="container-site">
        <div className="mb-8 grid grid-cols-1 gap-12 border-b border-white/10 pb-12 md:grid-cols-4">
          <div>
            <div className="font-display text-2xl font-semibold">Holistic Consulting</div>
            <span className="mt-1 mb-5 block text-[0.6rem] tracking-[0.18em] text-gold uppercase">
              Building Impactful Careers
            </span>
            <p className="max-w-[260px] text-[0.83rem] leading-7 text-cream/45">
              Advanced, evidence-informed education in functional nutrition, herbalism, and
              professional practice — for practitioners who want to practice with clarity,
              competence, and impact.
            </p>
          </div>
          <div>
            <h4 className="mb-5 text-[0.65rem] font-bold tracking-[0.18em] text-gold uppercase">
              Programs
            </h4>
            <ul className="space-y-2.5 text-[0.85rem] text-cream/65">
              <li>
                <Link href="https://holisticconsultinghq.com/programs" className="hover:text-cream">
                  Mentorship
                </Link>
              </li>
              <li>
                <Link href="https://holisticconsultinghq.com/programs" className="hover:text-cream">
                  Herbalism
                </Link>
              </li>
              <li>
                <Link href="https://holisticconsultinghq.com/programs" className="hover:text-cream">
                  BCHN Exam Prep
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-[0.65rem] font-bold tracking-[0.18em] text-gold uppercase">
              Institute
            </h4>
            <ul className="space-y-2.5 text-[0.85rem] text-cream/65">
              <li>
                <Link href="https://holisticconsultinghq.com/about" className="hover:text-cream">
                  About & Mission
                </Link>
              </li>
              <li>
                <Link href="https://holisticconsultinghq.com/results" className="hover:text-cream">
                  Results & Testimonials
                </Link>
              </li>
              <li>
                <Link href="https://journal.holisticconsultinghq.com/" className="hover:text-cream">
                  Blog & Resources
                </Link>
              </li>
              <li>
                <Link href="https://holisticconsultinghq.com/programs" className="hover:text-cream">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-[0.65rem] font-bold tracking-[0.18em] text-gold uppercase">
              Get Started
            </h4>
            <ul className="space-y-2.5 text-[0.85rem] text-cream/65">
              <li>
                <Link href="https://holisticconsultinghq.com/enroll" className="hover:text-cream">
                  Book a Discovery Call
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 text-[0.75rem] text-cream/30 sm:flex-row">
          <p>© {new Date().getFullYear()} Holistic Consulting Institute. All rights reserved.</p>
          <p>Built with care for practitioners who care.</p>
        </div>
      </div>
    </footer>
  );
}
