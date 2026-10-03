import Link from "next/link";

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
          <a href="#riders" className="transition hover:text-[#101828]">Riders</a>
          <a href="#drivers" className="transition hover:text-[#101828]">Drivers</a>
          <a href="#safety" className="transition hover:text-[#101828]">Safety</a>
          <a href="#download" className="transition hover:text-[#101828]">Download</a>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="#drivers"
            className="hidden text-[13px] font-semibold text-[#475467] transition hover:text-[#1877F2] sm:inline-flex">
            Drive with Vaya
          </a>
          <a
            href="#download"
            className="rounded-[6px] bg-[#1877F2] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#166FE5]">
            Get app
          </a>
        </div>
      </div>
    </header>
  );
}
