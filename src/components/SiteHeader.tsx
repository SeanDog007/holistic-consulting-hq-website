"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/library", label: "Library" },
  { href: "https://holisticconsultinghq.com/bchn-certification", label: "BCHN® Certification" },
  { href: "https://holisticconsultinghq.com/programs", label: "Programs" },
  { href: "https://herbs.holisticconsultinghq.com/", label: "Herbalism" },
  { href: "https://holisticconsultinghq.com/about", label: "About" },
  { href: "https://holisticconsultinghq.com/results", label: "Results" },
  { href: "https://journal.holisticconsultinghq.com/", label: "Journal" },
  { href: "https://holisticconsultinghq.com/contact", label: "Contact" },
] as const;

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/library") return pathname === "/library" || pathname.startsWith("/library/");
  return false;
}

export function SiteHeader({
  showLogout = false,
}: {
  active?: string;
  showLogout?: boolean;
}) {
  const pathname = usePathname();
  const showSignOut = showLogout && !pathname.includes("/login");

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/library" className="header-logo">
          <Image className="logo-mark" src="/images/logo-mark.png" alt="" width={42} height={42} priority />
          <span className="logo-textwrap">
            <span className="logo-text">Holistic Consulting</span>
            <span className="logo-tagline">Building Impactful Careers</span>
          </span>
        </Link>

        <nav className="header-nav" aria-label="Institute">
          {LINKS.map((link) => {
            const current = isCurrent(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={current ? "is-current" : undefined}
                aria-current={current ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
          {showSignOut ? (
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="header-signout">
                Sign out
              </button>
            </form>
          ) : null}
          <Link href="https://holisticconsultinghq.com/enroll" className="header-cta">
            Book a Call
          </Link>
        </nav>

        <details className="mobile-menu">
          <summary className="mobile-toggle" aria-controls="mobile-nav" aria-label="Menu">
            <span />
            <span />
            <span />
          </summary>
          <div id="mobile-nav" className="mobile-nav">
            {LINKS.map((link) => {
              const current = isCurrent(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
            {showSignOut ? (
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="header-signout">
                  Sign out
                </button>
              </form>
            ) : null}
            <Link href="https://holisticconsultinghq.com/enroll" className="mobile-cta">
              Book a Call
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
