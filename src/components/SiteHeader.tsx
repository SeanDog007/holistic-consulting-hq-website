"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/about.html", label: "About" },
  { href: "/programs.html", label: "Programs" },
  { href: "/results.html", label: "Results" },
  { href: "/library", label: "Library" },
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
    <header className="sticky top-0 z-50 border-b border-line bg-white/96 backdrop-blur-md">
      <div className="container-site flex items-center justify-between py-5">
        <Link href="/index.html" className="flex flex-col leading-none">
          <span className="font-display text-[1.35rem] font-bold tracking-[0.02em] text-emerald">
            Holistic Consulting
          </span>
          <span className="mt-[3px] text-[0.6rem] tracking-[0.18em] text-gold uppercase">
            Impactful Careers
          </span>
        </Link>

        <nav className="desktop-nav flex items-center gap-10">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[0.82rem] font-medium tracking-[0.04em] transition-colors hover:text-emerald ${
                active === link.label ? "text-emerald" : "text-charcoal"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {showSignOut ? (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-[0.72rem] font-medium tracking-[0.08em] text-slate uppercase hover:text-charcoal"
              >
                Sign out
              </button>
            </form>
          ) : null}
          <Link href="/enroll.html" className="nav-cta bg-gold px-[1.4rem] py-[0.6rem] text-[0.8rem] font-semibold tracking-[0.06em] text-white hover:bg-gold-lt">
            Book a Discovery Call
          </Link>
        </nav>

        <button
          type="button"
          className="mobile-menu-btn items-center border border-line px-3 py-2 text-[0.72rem] font-semibold tracking-[0.12em] text-charcoal uppercase"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-white">
          <div className="container-site flex flex-col gap-4 py-5">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm tracking-[0.04em]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {showSignOut ? (
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="text-sm text-slate">
                  Sign out
                </button>
              </form>
            ) : null}
            <Link href="/enroll.html" className="btn-primary w-fit">
              Book a Discovery Call
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
