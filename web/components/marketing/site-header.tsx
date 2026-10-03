import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0B1730]/92 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#1877F2] text-lg font-black shadow-[0_8px_24px_rgba(24,119,242,.35)]">
            V
          </span>
          <span className="text-[23px] font-black tracking-[-1.2px]">vaya</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-white/70 lg:flex">
          <a href="#why-vaya" className="transition hover:text-white">Why Vaya</a>
          <a href="#riders" className="transition hover:text-white">Riders</a>
          <a href="#drivers" className="transition hover:text-white">Drivers</a>
          <a href="#safety" className="transition hover:text-white">Safety</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/8 hover:text-white sm:inline-flex">
            Admin
          </Link>
          <a
            href="#download"
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#0B1730] transition hover:-translate-y-0.5 hover:bg-[#EAF3FF]">
            Get the app
          </a>
        </div>
      </div>
    </header>
  );
}
