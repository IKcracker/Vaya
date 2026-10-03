import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  Car,
  CircleDollarSign,
  LayoutDashboard,
  MapPinned,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

const nav = [
  [LayoutDashboard, "Overview"],
  [BadgeCheck, "Driver verification"],
  [MapPinned, "Trips"],
  [WalletCards, "Bookings"],
  [Users, "Passengers"],
  [CircleDollarSign, "Payments"],
  [ShieldCheck, "Safety & disputes"],
];

const stats = [
  ["Total users", "2,845", "+12.4%", Users],
  ["Verified drivers", "467", "+8.1%", BadgeCheck],
  ["Trips today", "132", "+18.7%", Car],
  ["Booking value", "R84,220", "+15.2%", CircleDollarSign],
];

const drivers = [
  ["Thabo Mokoena", "Toyota Corolla", "Submitted today", "Under review"],
  ["Lerato Ndlovu", "VW Polo", "1 document missing", "Needs info"],
  ["Tshepo Maluleke", "Toyota Avanza", "Submitted yesterday", "Under review"],
  ["Rendani Netshifhefhe", "Ford Everest", "All checks complete", "Ready to approve"],
];

const routes = [
  ["Polokwane → Pretoria", "38", "76"],
  ["Thohoyandou → Johannesburg", "27", "69"],
  ["Giyani → Pretoria", "21", "82"],
  ["Pretoria → Polokwane", "18", "64"],
];

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-[#F0F2F5] text-[#050505] lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="hidden border-r border-[#E4E6EB] bg-white p-5 lg:flex lg:flex-col">
        <Link href="/" className="mb-9 inline-flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1877F2] text-xl font-black text-white shadow-[0_8px_24px_rgba(24,119,242,.28)]">
            V
          </span>
          <span className="text-2xl font-black tracking-[-1.2px] text-[#1877F2]">vaya</span>
        </Link>

        <nav className="space-y-1">
          {nav.map(([Icon, label], index) => {
            const NavIcon = Icon as typeof LayoutDashboard;
            return (
              <button
                key={String(label)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-all duration-200 ${
                  index === 0
                    ? "bg-[#E7F3FF] text-[#1877F2]"
                    : "text-[#65676B] hover:translate-x-1 hover:bg-[#F0F2F5] hover:text-[#050505]"
                }`}>
                <NavIcon size={18} strokeWidth={2.3} />
                {String(label)}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-[#E4E6EB] bg-[#F8F9FB] p-4">
          <div className="text-[11px] font-black uppercase tracking-[.12em] text-[#65676B]">
            Platform health
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            All systems operational
          </div>
        </div>
      </aside>

      <section className="min-w-0 p-4 sm:p-6 xl:p-8">
        <header className="animate-fade-up mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="mb-2 inline-flex text-sm font-black text-[#1877F2] lg:hidden">
              ← Vaya
            </Link>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">Admin control centre</p>
            <h1 className="mt-2 text-2xl font-black tracking-[-.03em] sm:text-3xl">Operations overview</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65676B]">
              Verify drivers, monitor active routes, review bookings and keep every Vaya journey safe.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="grid h-11 w-11 place-items-center rounded-xl border border-[#E4E6EB] bg-white text-[#65676B] transition hover:-translate-y-0.5 hover:text-[#1877F2] hover:shadow-md">
              <Search size={18} />
            </button>
            <button className="relative grid h-11 w-11 place-items-center rounded-xl border border-[#E4E6EB] bg-white text-[#65676B] transition hover:-translate-y-0.5 hover:text-[#1877F2] hover:shadow-md">
              <Bell size={18} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <button className="rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-black text-white shadow-[0_8px_22px_rgba(24,119,242,.24)] transition hover:-translate-y-0.5 hover:bg-[#166FE5] hover:shadow-[0_12px_28px_rgba(24,119,242,.3)]">
              Review drivers
            </button>
          </div>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, trend, Icon], index) => {
            const StatIcon = Icon as typeof Users;
            return (
              <div
                key={String(label)}
                className="animate-fade-up rounded-2xl border border-white bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(20,40,80,.09)]"
                style={{ animationDelay: `${index * 70}ms` }}>
                <div className="flex items-start justify-between">
                  <div className="text-xs font-bold text-[#65676B]">{String(label)}</div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#E7F3FF] text-[#1877F2]">
                    <StatIcon size={17} />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black tracking-[-.03em]">{String(value)}</div>
                <div className="mt-2 flex items-center gap-1 text-xs font-bold text-green-600">
                  <TrendingUp size={13} />
                  {String(trend)} this month
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
          <section className="animate-fade-up overflow-hidden rounded-2xl border border-white bg-white shadow-[0_1px_2px_rgba(0,0,0,.05)]" style={{ animationDelay: "260ms" }}>
            <div className="flex items-center justify-between border-b border-[#E4E6EB] p-5">
              <div>
                <h2 className="font-black">Driver applications</h2>
                <p className="mt-1 text-xs text-[#65676B]">12 applications need attention</p>
              </div>
              <button className="text-sm font-black text-[#1877F2] transition hover:translate-x-0.5">View all →</button>
            </div>
            <div className="divide-y divide-[#E4E6EB]">
              {drivers.map(([name, vehicle, note, status]) => (
                <div
                  key={name}
                  className="grid gap-3 p-4 transition hover:bg-[#F8FAFD] sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F3FF] font-black text-[#1877F2]">
                      {name.split(" ").map((value) => value[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-black">{name}</div>
                      <div className="mt-1 text-xs text-[#65676B]">{vehicle}</div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-[#65676B]">{note}</div>
                  <div>
                    <span className="inline-flex rounded-full bg-[#E7F3FF] px-2.5 py-1.5 text-[11px] font-black text-[#1877F2]">
                      {status}
                    </span>
                  </div>
                  <button className="rounded-lg border border-[#E4E6EB] bg-white px-3 py-2 text-xs font-black transition hover:border-[#1877F2] hover:text-[#1877F2]">
                    Open
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-5">
            <section className="animate-fade-up rounded-2xl border border-white bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.05)]" style={{ animationDelay: "330ms" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-black">Popular routes</h2>
                  <p className="mt-1 text-xs text-[#65676B]">Demand across the network</p>
                </div>
                <MapPinned size={19} className="text-[#1877F2]" />
              </div>

              <div className="mt-3 divide-y divide-[#E4E6EB]">
                {routes.map(([route, count, occupancy]) => (
                  <div key={route} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold">{route}</div>
                      <span className="rounded-lg bg-[#E7F3FF] px-2 py-1 text-xs font-black text-[#1877F2]">{count}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E4E6EB]">
                      <div className="h-full rounded-full bg-[#1877F2]" style={{ width: `${occupancy}%` }} />
                    </div>
                    <div className="mt-1.5 text-[11px] text-[#65676B]">{occupancy}% occupied</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="animate-fade-up relative overflow-hidden rounded-2xl bg-[#1877F2] p-5 text-white shadow-[0_15px_36px_rgba(24,119,242,.24)]" style={{ animationDelay: "400ms" }}>
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" />
              <div className="absolute -bottom-16 left-8 h-28 w-28 rounded-full bg-white/10" />
              <Car size={25} />
              <h2 className="mt-4 text-lg font-black">132 trips active today</h2>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                Long-distance rides remain the launch focus while local ride infrastructure is prepared on the same safety foundation.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
