"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#riders", label: "For riders" },
  { href: "#routes", label: "Routes" },
  { href: "#drivers", label: "For drivers" },
  { href: "#safety", label: "Safety" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMobileNav = () => setMobileOpen(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300 ${scrolled ? "header-elevated border-[#E4E7EC] bg-white/98" : "border-[#EAECF0] bg-white/92"} backdrop-blur-xl`}>
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="group inline-flex items-baseline"
          aria-label="Vaya home"
          onClick={closeMobileNav}>
          <span className="text-[23px] font-extrabold tracking-[-1.2px] text-[#101828] transition-colors group-hover:text-[#344054]">
            vaya
          </span>
          <span className="ml-0.5 text-[23px] font-black text-[#1877F2] transition-transform duration-200 group-hover:-translate-y-0.5">
            .
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] font-semibold text-[#667085] lg:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="nav-link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 sm:flex">
          <a
            href="#drivers"
            className="nav-link text-[13px] font-semibold text-[#475467]">
            Drive with Vaya
          </a>
          <a
            href="#download"
            className="button-lift rounded-[7px] bg-[#1877F2] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,.14)] hover:bg-[#166FE5] hover:shadow-[0_10px_24px_rgba(24,119,242,.2)]">
            Get the app
          </a>
        </div>

        <div className="relative sm:hidden">
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMobileOpen((open) => !open)}
            className="button-lift grid h-9 w-9 place-items-center rounded-[7px] border border-[#D0D5DD] bg-white text-[#344054] hover:border-[#B8C7DA] hover:bg-[#F8FAFC]">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {mobileOpen ? (
            <div
              id="mobile-navigation"
              className="mobile-menu-enter absolute right-0 top-12 w-[272px] rounded-[12px] border border-[#E4E7EC] bg-white p-2 shadow-[0_20px_48px_rgba(16,24,40,.14)]">
              <nav className="grid text-[13px] font-semibold text-[#475467]" aria-label="Mobile navigation">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileNav}
                    className="rounded-[8px] px-3 py-3 transition-colors hover:bg-[#F5F9FF] hover:text-[#1877F2]">
                    {item.label}
                  </a>
                ))}
              </nav>
              <a
                href="#download"
                onClick={closeMobileNav}
                className="mt-2 flex items-center justify-center rounded-[7px] bg-[#1877F2] px-4 py-3 text-[13px] font-bold text-white">
                Get the app
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
