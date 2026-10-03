import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Clock3,
  Luggage,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

const heroImage =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&fm=jpg&q=88&w=2200";

export function Hero() {
  return (
    <section className="bg-white pt-[72px]">
      <div className="mx-auto max-w-[1280px] px-5 pt-5 sm:px-8 lg:px-10">
        <div
          className="relative min-h-[610px] overflow-hidden rounded-[28px] bg-cover bg-center shadow-[0_24px_70px_rgba(25,39,67,.14)]"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(7,16,32,.94) 0%, rgba(7,16,32,.78) 40%, rgba(7,16,32,.28) 70%, rgba(7,16,32,.10) 100%), url("${heroImage}")`,
          }}>
          <div className="relative z-10 flex min-h-[610px] max-w-[700px] flex-col justify-center px-6 py-16 text-white sm:px-10 lg:px-14">
            <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-black backdrop-blur">
              <CarFront size={14} className="text-[#74AEFF]" />
              LONG-DISTANCE TRAVEL, REIMAGINED
            </div>

            <h1 className="text-[3.25rem] font-black leading-[.98] tracking-[-.06em] sm:text-[4.25rem] lg:text-[5rem]">
              Travel farther.
              <span className="block text-[#63A4FF]">Travel better.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Find verified drivers already travelling your route, compare the details that matter and reserve your seat before travel day.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#download"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1877F2] px-6 py-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(24,119,242,.28)] transition hover:-translate-y-0.5 hover:bg-[#2D86F7]">
                Get Vaya
                <ArrowRight size={17} className="transition group-hover:translate-x-1" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">
                How it works
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/78">
                <BadgeCheck size={17} className="text-[#63A4FF]" />
                Verified drivers
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white/78">
                <Luggage size={17} className="text-[#63A4FF]" />
                Luggage planning
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white/78">
                <ShieldCheck size={17} className="text-[#63A4FF]" />
                Safer bookings
              </div>
            </div>
          </div>

          <div className="absolute bottom-7 right-7 hidden rounded-2xl border border-white/20 bg-black/25 px-4 py-3 text-white backdrop-blur-md lg:block">
            <div className="text-[10px] font-black uppercase tracking-[.14em] text-white/55">Example route</div>
            <div className="mt-1 text-sm font-black">Polokwane → Pretoria</div>
          </div>
        </div>

        <div className="relative z-20 mx-auto -mt-16 max-w-[1120px] rounded-[24px] border border-[#E4E6EB] bg-white p-3 shadow-[0_22px_55px_rgba(24,50,90,.14)] sm:p-4">
          <div className="grid gap-2 border-b border-[#E4E6EB] pb-3 sm:grid-cols-2">
            <button className="rounded-xl bg-[#E7F3FF] px-4 py-3 text-sm font-black text-[#1877F2]">
              Long distance
            </button>
            <button className="rounded-xl px-4 py-3 text-sm font-bold text-[#65676B] transition hover:bg-[#F0F2F5]">
              Local ride <span className="ml-1 text-[10px] font-black text-[#8A8D91]">COMING SOON</span>
            </button>
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-[1.15fr_1.15fr_.85fr_.75fr_auto]">
            <div className="flex min-h-16 items-center gap-3 rounded-xl border border-[#E4E6EB] px-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F0F2F5] text-[#65676B]">
                <MapPin size={16} />
              </span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-[#8A8D91]">From</div>
                <div className="mt-1 text-sm font-black text-[#050505]">Pickup area</div>
              </div>
            </div>

            <div className="flex min-h-16 items-center gap-3 rounded-xl border border-[#E4E6EB] px-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                <MapPin size={16} />
              </span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-[#8A8D91]">To</div>
                <div className="mt-1 text-sm font-black text-[#050505]">Destination</div>
              </div>
            </div>

            <div className="flex min-h-16 items-center gap-3 rounded-xl border border-[#E4E6EB] px-4">
              <CalendarDays size={17} className="text-[#1877F2]" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-[#8A8D91]">Date</div>
                <div className="mt-1 text-sm font-black text-[#050505]">Choose date</div>
              </div>
            </div>

            <div className="flex min-h-16 items-center gap-3 rounded-xl border border-[#E4E6EB] px-4">
              <Users size={17} className="text-[#1877F2]" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-[#8A8D91]">Seats</div>
                <div className="mt-1 text-sm font-black text-[#050505]">1 passenger</div>
              </div>
            </div>

            <button className="flex min-h-16 items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-6 text-sm font-black text-white transition hover:bg-[#166FE5]">
              Find ride <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-xs font-semibold text-[#65676B]">
            <span className="flex items-center gap-2"><Clock3 size={14} className="text-[#1877F2]" /> Planned departures</span>
            <span className="flex items-center gap-2"><BadgeCheck size={14} className="text-[#1877F2]" /> Driver verification</span>
            <span className="flex items-center gap-2"><Luggage size={14} className="text-[#1877F2]" /> Luggage capacity shown</span>
          </div>
        </div>
      </div>
    </section>
  );
}
