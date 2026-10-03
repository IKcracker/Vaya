import { BadgeCheck, Car, CircleDollarSign, LayoutDashboard, MapPinned, ShieldCheck, Users, WalletCards } from "lucide-react";

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
  ["Total users", "2,845", "+12.4%"],
  ["Verified drivers", "467", "+8.1%"],
  ["Trips today", "132", "+18.7%"],
  ["Booking value", "R84,220", "+15.2%"],
];

const drivers = [
  ["Thabo Mokoena", "Toyota Corolla", "Submitted today", "Under review"],
  ["Lerato Ndlovu", "VW Polo", "1 document missing", "Needs info"],
  ["Tshepo Maluleke", "Toyota Avanza", "Submitted yesterday", "Under review"],
  ["Rendani Netshifhefhe", "Ford Everest", "All checks complete", "Ready to approve"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F0F2F5] text-[#050505] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-[#E4E6EB] bg-white p-5 lg:block">
        <div className="mb-8 text-3xl font-black tracking-[-1.5px] text-[#1877F2]">vaya</div>
        <div className="space-y-1">
          {nav.map(([Icon, label], index) => {
            const NavIcon = Icon as typeof LayoutDashboard;
            return (
              <button key={String(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${index === 0 ? "bg-[#E7F3FF] text-[#1877F2]" : "text-[#65676B] hover:bg-[#F0F2F5]"}`}>
                <NavIcon size={18} strokeWidth={2.4} />
                {String(label)}
              </button>
            );
          })}
        </div>
        <div className="mt-8 rounded-2xl bg-[#F0F2F5] p-4">
          <div className="text-xs font-black uppercase tracking-wide text-[#65676B]">Platform health</div>
          <div className="mt-3 flex items-center gap-2 text-sm font-bold"><span className="h-2.5 w-2.5 rounded-full bg-green-500" /> All systems operational</div>
        </div>
      </aside>

      <section className="min-w-0 p-4 sm:p-6 xl:p-8">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 text-sm font-black text-[#1877F2] lg:hidden">vaya</div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Operations overview</h1>
            <p className="mt-1 text-sm text-[#65676B]">Verify drivers, monitor trips and keep the marketplace safe.</p>
          </div>
          <button className="rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-[#166FE5]">Review driver applications</button>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, trend]) => (
            <div key={label} className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <div className="text-xs font-bold text-[#65676B]">{label}</div>
              <div className="mt-2 text-2xl font-black">{value}</div>
              <div className="mt-2 text-xs font-bold text-green-600">{trend} this month</div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
          <section className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,.06)]">
            <div className="flex items-center justify-between border-b border-[#E4E6EB] p-5">
              <div>
                <h2 className="font-black">Driver applications</h2>
                <p className="mt-1 text-xs text-[#65676B]">12 applications need attention</p>
              </div>
              <button className="text-sm font-black text-[#1877F2]">View all</button>
            </div>
            <div className="divide-y divide-[#E4E6EB]">
              {drivers.map(([name, vehicle, note, status]) => (
                <div key={name} className="grid gap-3 p-4 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F3FF] font-black text-[#1877F2]">{name.split(" ").map(v => v[0]).join("")}</div>
                    <div><div className="text-sm font-black">{name}</div><div className="mt-1 text-xs text-[#65676B]">{vehicle}</div></div>
                  </div>
                  <div className="text-xs font-medium text-[#65676B]">{note}</div>
                  <div><span className="inline-flex rounded-full bg-[#E7F3FF] px-2.5 py-1.5 text-[11px] font-black text-[#1877F2]">{status}</span></div>
                  <button className="rounded-lg border border-[#E4E6EB] bg-white px-3 py-2 text-xs font-black hover:bg-[#F0F2F5]">Open</button>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <h2 className="font-black">Popular routes</h2>
              <div className="mt-3 divide-y divide-[#E4E6EB]">
                {[["Polokwane → Pretoria","38"],["Thohoyandou → Johannesburg","27"],["Giyani → Pretoria","21"],["Pretoria → Polokwane","18"]].map(([route,count]) => (
                  <div key={route} className="flex items-center justify-between py-3">
                    <div><div className="text-sm font-bold">{route}</div><div className="mt-1 text-[11px] text-[#65676B]">Trips today</div></div>
                    <span className="rounded-lg bg-[#E7F3FF] px-2 py-1 text-xs font-black text-[#1877F2]">{count}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-[#1877F2] p-5 text-white">
              <Car size={25} />
              <h2 className="mt-4 text-lg font-black">132 trips active today</h2>
              <p className="mt-2 text-sm leading-6 text-blue-100">Long-distance trips are the primary MVP mode. Local on-demand rides will plug into the same driver and safety system later.</p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
