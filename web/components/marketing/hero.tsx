import {
  ArrowRight,
  BadgeCheck,
  Car,
  ChevronRight,
  Clock3,
  Luggage,
  MapPin,
  Route,
  Users,
} from "lucide-react";

const routes = [
  ["Pretoria", "Polokwane"],
  ["Johannesburg", "Thohoyandou"],
  ["Pretoria", "Giyani"],
  ["Polokwane", "Midrand"],
];

export function Hero() {
  return (
    <section className="relative bg-[#0B1730] pt-[72px] text-white">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,#1877F2_0,transparent_28%),radial-gradient(circle_at_82%_40%,#1877F2_0,transparent_22%)]" />
      <div className="absolute inset-0 opacity-[.11] [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:px-12 lg:py-24">
        <div className="animate-fade-up max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-2 text-xs font-bold text-white/80">
            <Route size={14} className="text-[#7DB7FF]" />
            Built for scheduled long-distance travel
          </div>

          <h1 className="text-[3.2rem] font-black leading-[.98] tracking-[-.06em] sm:text-[4.6rem] xl:text-[5.3rem]">
            Your seat home,
            <span className="block text-[#60A5FA]">sorted before you leave.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-[#B7C3D8]">
            Find verified drivers already travelling your route, compare their fares and pickup points, then reserve the ride that works for you.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#download"
              className="group inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#1877F2] px-6 py-4 font-black text-white shadow-[0_16px_36px_rgba(24,119,242,.3)] transition hover:-translate-y-1 hover:bg-[#2D86F7]">
              Download Vaya
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </a>
            <a
              href="#why-vaya"
              className="inline-flex items-center justify-center rounded-[14px] border border-white/15 bg-white/6 px-6 py-4 font-black text-white transition hover:bg-white/10">
              How Vaya works
            </a>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#C7D1E2]">
            <span className="flex items-center gap-2"><BadgeCheck size={17} className="text-[#60A5FA]" /> Driver verification</span>
            <span className="flex items-center gap-2"><Luggage size={17} className="text-[#60A5FA]" /> Luggage-aware bookings</span>
            <span className="flex items-center gap-2"><Users size={17} className="text-[#60A5FA]" /> Shared long trips</span>
          </div>
        </div>

        <div className="animate-fade-up relative" style={{ animationDelay: "120ms" }}>
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#101F3C] p-5 shadow-[0_38px_90px_rgba(0,0,0,.34)] sm:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#7DB7FF]">Route preview</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">Limpopo → Gauteng</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/7 px-3 py-2 text-xs font-bold text-white/70">
                Long distance
              </span>
            </div>

            <div className="relative mt-7 rounded-[24px] border border-white/10 bg-[#0B1730] p-5 sm:p-7">
              <div className="absolute left-[35px] top-[44px] h-[calc(100%-88px)] w-px bg-gradient-to-b from-[#1877F2] via-[#60A5FA] to-white/20" />

              {[
                ["Polokwane", "06:00", "Pickup"],
                ["Mokopane", "07:00", "Stop"],
                ["Midrand", "09:25", "Drop-off"],
                ["Pretoria", "10:00", "Destination"],
              ].map(([place, time, type], index) => (
                <div key={place} className="relative flex items-center gap-4 py-4">
                  <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-4 border-[#0B1730] ${
                    index === 0 ? "bg-[#1877F2]" : index === 3 ? "bg-white" : "bg-[#60A5FA]"
                  }`}>
                    {index === 3 ? <MapPin size={13} className="text-[#0B1730]" /> : null}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                    <div>
                      <div className="font-black">{place}</div>
                      <div className="mt-1 text-xs text-white/45">{type}</div>
                    </div>
                    <div className="text-sm font-bold text-white/65">{time}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-white/10 bg-white/6 p-4">
                <Car size={18} className="text-[#60A5FA]" />
                <div className="mt-3 text-xs text-white/45">Choose vehicle</div>
                <div className="mt-1 text-sm font-black">Compare rides</div>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/6 p-4">
                <Luggage size={18} className="text-[#60A5FA]" />
                <div className="mt-3 text-xs text-white/45">Plan luggage</div>
                <div className="mt-1 text-sm font-black">Know capacity</div>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/6 p-4">
                <BadgeCheck size={18} className="text-[#60A5FA]" />
                <div className="mt-3 text-xs text-white/45">Book confidently</div>
                <div className="mt-1 text-sm font-black">Verified driver</div>
              </div>
            </div>
          </div>

          <div className="animate-float absolute -left-8 bottom-16 hidden rounded-2xl border border-[#D7E8FF] bg-white p-4 text-[#101828] shadow-[0_20px_50px_rgba(3,12,28,.22)] xl:block">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]"><Clock3 size={19} /></div>
              <div>
                <div className="text-xs font-black">Leave when planned</div>
                <div className="mt-1 text-[11px] text-[#667085]">No waiting for a taxi to fill</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:px-12">
          <span className="shrink-0 text-xs font-black uppercase tracking-[.14em] text-white/40">Common routes</span>
          <div className="flex flex-wrap gap-2.5">
            {routes.map(([from, to]) => (
              <span key={from + to} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white/70">
                {from} <ChevronRight size={13} className="text-[#60A5FA]" /> {to}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
