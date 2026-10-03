import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Luggage,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-[72px]">
      <div className="absolute -left-40 top-28 h-[420px] w-[420px] rounded-full bg-[#E7F3FF] blur-3xl" />
      <div className="absolute -right-44 top-12 h-[500px] w-[500px] rounded-full bg-[#F0F2F5] blur-3xl" />

      <div className="relative mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_.95fr] lg:px-12 lg:py-24">
        <div className="animate-fade-up max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D8E8FF] bg-[#F7FAFF] px-3.5 py-2 text-xs font-black text-[#1877F2]">
            <CarFront size={14} />
            Long-distance travel, organised properly
          </div>

          <h1 className="max-w-[760px] text-[3.35rem] font-black leading-[.98] tracking-[-.06em] text-[#050505] sm:text-[4.6rem] xl:text-[5.35rem]">
            Find your ride.
            <span className="block text-[#1877F2]">Travel on your terms.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#65676B] sm:text-xl">
            Vaya helps you find verified drivers already travelling your route. Compare departure times, prices, pickup points and luggage space before you book.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#download"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1877F2] px-6 py-4 font-black text-white shadow-[0_12px_28px_rgba(24,119,242,.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#166FE5]">
              Download Vaya
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-[#DADDE1] bg-white px-6 py-4 font-black text-[#050505] transition hover:border-[#B8D5FA] hover:bg-[#F7FAFF]">
              See how it works
            </a>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#65676B]">
            <span className="flex items-center gap-2">
              <BadgeCheck size={17} className="text-[#1877F2]" />
              Verified drivers
            </span>
            <span className="flex items-center gap-2">
              <Luggage size={17} className="text-[#1877F2]" />
              Luggage-aware rides
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-[#1877F2]" />
              Safer booking flow
            </span>
          </div>
        </div>

        <div className="animate-fade-up relative" style={{ animationDelay: "120ms" }}>
          <div className="relative rounded-[32px] border border-[#E4E6EB] bg-[#F7F8FA] p-4 shadow-[0_24px_70px_rgba(21,44,84,.10)] sm:p-6">
            <div className="rounded-[26px] bg-white p-5 sm:p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#1877F2]">Plan a trip</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-[#050505]">Where are you going?</h2>
                </div>
                <span className="rounded-full bg-[#E7F3FF] px-3 py-2 text-xs font-black text-[#1877F2]">
                  Long distance
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4 rounded-2xl border border-[#E4E6EB] px-4 py-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#F0F2F5] text-[#65676B]">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold text-[#8A8D91]">Leaving from</div>
                    <div className="mt-1 text-sm font-black text-[#050505]">Polokwane</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-[#E4E6EB] px-4 py-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold text-[#8A8D91]">Going to</div>
                    <div className="mt-1 text-sm font-black text-[#050505]">Pretoria</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border border-[#E4E6EB] px-4 py-4">
                  <CalendarDays size={18} className="text-[#1877F2]" />
                  <div>
                    <div className="text-[11px] font-bold text-[#8A8D91]">Travel date</div>
                    <div className="mt-1 text-sm font-black">Choose date</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-[#E4E6EB] px-4 py-4">
                  <Users size={18} className="text-[#1877F2]" />
                  <div>
                    <div className="text-[11px] font-bold text-[#8A8D91]">Passengers</div>
                    <div className="mt-1 text-sm font-black">1 passenger</div>
                  </div>
                </div>
              </div>

              <button className="mt-5 w-full rounded-full bg-[#1877F2] py-4 text-sm font-black text-white transition hover:bg-[#166FE5]">
                Search available rides
              </button>

              <div className="mt-6 border-t border-[#E4E6EB] pt-5">
                <div className="text-xs font-black text-[#050505]">Popular routes</div>
                <div className="mt-3 grid gap-2">
                  {[
                    ["Pretoria", "Polokwane"],
                    ["Johannesburg", "Thohoyandou"],
                    ["Pretoria", "Giyani"],
                  ].map(([from, to]) => (
                    <div
                      key={from + to}
                      className="flex items-center justify-between rounded-xl bg-[#F7F8FA] px-3.5 py-3 text-sm">
                      <span className="font-bold text-[#344054]">{from} → {to}</span>
                      <span className="text-xs font-black text-[#1877F2]">View</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
