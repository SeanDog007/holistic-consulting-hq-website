"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/about.html", label: "About" },
  { href: "/programs.html", label: "Programs" },
  { href: "/results.html", label: "Results" },
  { href: "/faq.html", label: "FAQ" },
];

export function SiteHeader({
  active = "Library",
  showLogout = false,
}: {
  active?: string;
  showLogout?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const showSignOut = showLogout && !pathname.includes("/login");

  return (
    <header className="sticky top-0 z-50 bg-forest">
      <div className="container-site flex items-center justify-between py-4">
        <Link href="/index.html" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 text-gold">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M8 14.5c-.3-2.4.4-4 1.8-5.3C11 8 12.4 7.3 13.2 7.1c-.7 1.3-.7 2.8.1 4.3-1.5-.2-3.3.6-5.3 3.1Z"
                fill="currentColor"
              />
              <path
                d="M8 14.5c.3-2.5-.6-4.1-2-5.4C4.8 8 3.3 7.3 2.4 7.2c.9 1.4.8 2.9-.1 4.4 1.6-.1 3.5.7 5.7 2.9Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.25rem] font-semibold tracking-[0.02em] text-cream">
              Holistic Consulting
            </span>
            <span className="mt-[4px] text-[0.58rem] tracking-[0.18em] text-gold uppercase">
              Building Impactful Careers
            </span>
          </span>
        </Link>

        <nav className="desktop-nav flex items-center gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[0.76rem] font-medium tracking-[0.08em] uppercase transition-colors hover:text-gold ${
                active === link.label ? "text-gold" : "text-cream"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {showSignOut ? (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-[0.72rem] font-medium tracking-[0.08em] text-cream/55 uppercase hover:text-cream"
              >
                Sign out
              </button>
            </form>
          ) : null}
          <Link
            href="/enroll.html"
            className="bg-gold px-5 py-2.5 text-[0.75rem] font-semibold tracking-[0.1em] text-white uppercase hover:bg-gold-lt"
          >
            Book a Call
          </Link>
        </nav>

        <button
          type="button"
          className="mobile-menu-btn items-center border border-cream/25 px-3 py-2 text-[0.72rem] font-semibold tracking-[0.12em] text-cream uppercase"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-forest">
          <div className="container-site flex flex-col gap-4 py-5">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm tracking-[0.06em] text-cream uppercase"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {showSignOut ? (
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="text-sm text-cream/60">
                  Sign out
                </button>
              </form>
            ) : null}
            <Link href="/enroll.html" className="btn-primary w-fit">
              Book a Call
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
