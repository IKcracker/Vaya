import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  Car,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  MapPinned,
  Search,
  ShieldAlert,
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
  [ShieldAlert, "Safety & disputes"],
];

const reviewQueue = [
  ["TM", "Thabo Mokoena", "Toyota Corolla • Limpopo", "Licence + vehicle", "Review"],
  ["LN", "Lerato Ndlovu", "VW Polo • Gauteng", "Missing vehicle disc", "Needs info"],
  ["RM", "Rendani Mulaudzi", "Ford Everest • Limpopo", "All checks complete", "Approve"],
];

const trips = [
  ["Polokwane", "Pretoria", "06:00", "3/4", "On schedule"],
  ["Thohoyandou", "Johannesburg", "07:15", "4/4", "Full"],
  ["Giyani", "Pretoria", "08:30", "2/4", "On schedule"],
];

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#101828] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-[#E4E7EC] bg-[#0B1730] p-5 text-white lg:flex lg:flex-col">
        <Link href="/" className="mb-9 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#1877F2] font-black">V</span>
          <span className="text-xl font-black tracking-[-1px]">vaya admin</span>
        </Link>

        <nav className="space-y-1">
          {nav.map(([Icon, label], index) => {
            const NavIcon = Icon as typeof LayoutDashboard;
            return (
              <button
                key={String(label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                  index === 0 ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/7 hover:text-white"
                }`}>
                <NavIcon size={17} strokeWidth={2.2} />
                {String(label)}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-white/35">Operations</div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-white/65">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Platform online
          </div>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="border-b border-[#E4E7EC] bg-white">
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <Link href="/" className="mb-2 inline-flex text-sm font-black text-[#1877F2] lg:hidden">← Vaya</Link>
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#1877F2]">Operations centre</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-.03em]">Today&apos;s network</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="grid h-10 w-10 place-items-center rounded-xl border border-[#E4E7EC] bg-white text-[#667085]"><Search size={17} /></button>
              <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#E4E7EC] bg-white text-[#667085]">
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F04438]" />
              </button>
              <button className="rounded-xl bg-[#1877F2] px-4 py-2.5 text-sm font-black text-white">Review drivers</button>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 lg:p-8">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Driver reviews", "12", "5 ready to approve"],
              ["Scheduled trips", "43", "Today"],
              ["Booked seats", "118", "Across active trips"],
              ["Open reports", "3", "Needs attention"],
            ].map(([label, value, note]) => (
              <div key={label} className="rounded-2xl border border-[#E4E7EC] bg-white p-5">
                <div className="text-xs font-bold text-[#667085]">{label}</div>
                <div className="mt-3 text-3xl font-black tracking-[-.04em]">{value}</div>
                <div className="mt-2 text-xs text-[#98A2B3]">{note}</div>
              </div>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
            <section className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
              <div className="flex items-center justify-between border-b border-[#E4E7EC] px-5 py-4">
                <div>
                  <h2 className="font-black">Driver verification queue</h2>
                  <p className="mt-1 text-xs text-[#667085]">Review documents before publishing access is granted.</p>
                </div>
                <button className="text-xs font-black text-[#1877F2]">View all</button>
              </div>
              <div className="divide-y divide-[#EEF1F4]">
                {reviewQueue.map(([initials, name, vehicle, state, action]) => (
                  <div key={name} className="grid gap-3 px-5 py-4 md:grid-cols-[1.3fr_1fr_auto] md:items-center">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F3FF] text-xs font-black text-[#1877F2]">{initials}</div>
                      <div>
                        <div className="text-sm font-black">{name}</div>
                        <div className="mt-1 text-xs text-[#667085]">{vehicle}</div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#667085]">{state}</div>
                    <button className="inline-flex items-center gap-1 rounded-lg border border-[#D0D5DD] px-3 py-2 text-xs font-black text-[#344054]">
                      {action} <ChevronRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#E4E7EC] bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-black">Active routes</h2>
                  <p className="mt-1 text-xs text-[#667085]">Upcoming departures</p>
                </div>
                <MapPinned size={19} className="text-[#1877F2]" />
              </div>

              <div className="mt-4 space-y-3">
                {trips.map(([from, to, time, seats, status]) => (
                  <div key={from + to} className="rounded-xl border border-[#EAECF0] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-black">{from} → {to}</div>
                      <span className="text-xs font-black text-[#1877F2]">{time}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-[#667085]">
                      <span>{seats} seats booked</span>
                      <span>{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#E4E7EC] bg-white p-5">
              <Car size={19} className="text-[#1877F2]" />
              <div className="mt-4 text-xs font-bold text-[#667085]">Drivers online</div>
              <div className="mt-1 text-xl font-black">86</div>
            </div>
            <div className="rounded-2xl border border-[#E4E7EC] bg-white p-5">
              <Users size={19} className="text-[#1877F2]" />
              <div className="mt-4 text-xs font-bold text-[#667085]">Passengers travelling today</div>
              <div className="mt-1 text-xl font-black">118</div>
            </div>
            <div className="rounded-2xl border border-[#E4E7EC] bg-white p-5">
              <ShieldAlert size={19} className="text-[#F04438]" />
              <div className="mt-4 text-xs font-bold text-[#667085]">Safety reports</div>
              <div className="mt-1 text-xl font-black">3 open</div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
