import Link from "next/link";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#EAECF0] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="inline-flex items-baseline" aria-label="Vaya home">
          <span className="text-[23px] font-extrabold tracking-[-1.2px] text-[#101828]">vaya</span>
          <span className="ml-0.5 text-[23px] font-black text-[#1877F2]">.</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] font-semibold text-[#667085] lg:flex">
          <a href="#how-it-works" className="transition hover:text-[#101828]">How it works</a>
          <a href="#riders" className="transition hover:text-[#101828]">For riders</a>
          <a href="#routes" className="transition hover:text-[#101828]">Routes</a>
          <a href="#drivers" className="transition hover:text-[#101828]">For drivers</a>
          <a href="#safety" className="transition hover:text-[#101828]">Safety</a>
        </nav>

        <div className="hidden items-center gap-4 sm:flex">
          <a
            href="#drivers"
            className="text-[13px] font-semibold text-[#475467] transition hover:text-[#1877F2]">
            Drive with Vaya
          </a>
          <a
            href="#download"
            className="rounded-[7px] bg-[#1877F2] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#166FE5]">
            Get the app
          </a>
        </div>

        <details className="group relative sm:hidden">
          <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-[7px] border border-[#D0D5DD] bg-white text-[#344054] [&::-webkit-details-marker]:hidden">
            <Menu size={18} className="group-open:hidden" />
            <X size={18} className="hidden group-open:block" />
            <span className="sr-only">Open navigation</span>
          </summary>
          <div className="absolute right-0 top-12 w-[260px] rounded-[12px] border border-[#E4E7EC] bg-white p-2 shadow-[0_18px_45px_rgba(16,24,40,.14)]">
            <nav className="grid text-[13px] font-semibold text-[#475467]">
              <a href="#how-it-works" className="rounded-[8px] px-3 py-3 hover:bg-[#F7F8FA]">How it works</a>
              <a href="#riders" className="rounded-[8px] px-3 py-3 hover:bg-[#F7F8FA]">For riders</a>
              <a href="#routes" className="rounded-[8px] px-3 py-3 hover:bg-[#F7F8FA]">Routes</a>
              <a href="#drivers" className="rounded-[8px] px-3 py-3 hover:bg-[#F7F8FA]">For drivers</a>
              <a href="#safety" className="rounded-[8px] px-3 py-3 hover:bg-[#F7F8FA]">Safety</a>
            </nav>
            <a
              href="#download"
              className="mt-2 flex items-center justify-center rounded-[7px] bg-[#1877F2] px-4 py-3 text-[13px] font-bold text-white">
              Get the app
            </a>
          </div>
        </details>
      </div>
    </header>
  );
}
