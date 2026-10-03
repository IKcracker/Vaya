import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0B1220]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Vaya home">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#1877F2] text-lg font-black text-white shadow-[0_8px_24px_rgba(24,119,242,.30)]">
            V
          </span>
          <span className="text-[24px] font-black tracking-[-1.4px]">vaya</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-white/68 lg:flex">
          <a href="#how-it-works" className="transition hover:text-white">How it works</a>
          <a href="#riders" className="transition hover:text-white">Ride options</a>
          <a href="#drivers" className="transition hover:text-white">Drive with Vaya</a>
          <a href="#safety" className="transition hover:text-white">Safety</a>
          <a href="#download" className="transition hover:text-white">App</a>
        </nav>

        <a
          href="#download"
          className="rounded-full bg-[#1877F2] px-5 py-2.5 text-sm font-black text-white transition duration-200 hover:bg-[#2D86F7]">
          Get Vaya
        </a>
      </div>
    </header>
  );
}
