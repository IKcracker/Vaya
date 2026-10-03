import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E4E6EB] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="Vaya home">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1877F2] text-lg font-black text-white shadow-[0_8px_24px_rgba(24,119,242,.20)]">
            V
          </span>
          <span className="text-[24px] font-black tracking-[-1.4px] text-[#050505]">vaya</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-[#65676B] lg:flex">
          <a href="#how-it-works" className="transition hover:text-[#1877F2]">How it works</a>
          <a href="#riders" className="transition hover:text-[#1877F2]">For riders</a>
          <a href="#drivers" className="transition hover:text-[#1877F2]">For drivers</a>
          <a href="#safety" className="transition hover:text-[#1877F2]">Safety</a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#drivers"
            className="hidden rounded-full px-4 py-2.5 text-sm font-bold text-[#050505] transition hover:bg-[#F0F2F5] sm:inline-flex">
            Drive with Vaya
          </a>
          <a
            href="#download"
            className="rounded-full bg-[#1877F2] px-5 py-2.5 text-sm font-black text-white transition duration-200 hover:bg-[#166FE5]">
            Download app
          </a>
        </div>
      </div>
    </header>
  );
}
