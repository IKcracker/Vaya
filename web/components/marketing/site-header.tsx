import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E4E6EB] bg-white/96 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Vaya home">
          <span className="grid h-8 w-8 place-items-center bg-[#1877F2] text-[13px] font-extrabold text-white">
            V
          </span>
          <span className="text-[21px] font-extrabold tracking-[-1px] text-[#101828]">vaya</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] font-semibold text-[#5F6673] lg:flex">
          <a href="#how-it-works" className="transition hover:text-[#1877F2]">How it works</a>
          <a href="#riders" className="transition hover:text-[#1877F2]">Riders</a>
          <a href="#drivers" className="transition hover:text-[#1877F2]">Drivers</a>
          <a href="#safety" className="transition hover:text-[#1877F2]">Safety</a>
          <a href="#download" className="transition hover:text-[#1877F2]">Download</a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#drivers"
            className="hidden px-3 py-2 text-[13px] font-semibold text-[#344054] transition hover:text-[#1877F2] sm:inline-flex">
            Drive with Vaya
          </a>
          <a
            href="#download"
            className="bg-[#1877F2] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#166FE5]">
            Get the app
          </a>
        </div>
      </div>
    </header>
  );
}
