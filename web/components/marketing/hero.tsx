import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Luggage,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

const heroImage =
  "https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&fm=jpg&q=88&w=2400";

export function Hero() {
  return (
    <section className="relative bg-[#0B1220] pt-16 text-white">
      <div
        className="absolute inset-x-0 top-16 h-[690px] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(4,10,22,.96) 0%, rgba(4,10,22,.82) 42%, rgba(4,10,22,.42) 74%, rgba(4,10,22,.22) 100%), url("${heroImage}")`,
        }}
      />
      <div className="absolute inset-x-0 top-16 h-[690px] bg-[linear-gradient(180deg,transparent_58%,#0B1220_100%)]" />

      <div className="relative mx-auto min-h-[690px] max-w-[1280px] px-5 sm:px-8 lg:px-10">
        <div className="flex min-h-[690px] max-w-[790px] flex-col justify-center pb-24 pt-14">
          <div className="mb-7 flex w-fit items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[#7DB7FF]">
            <span className="h-px w-8 bg-[#1877F2]" />
            Shared trips across South Africa
          </div>

          <h1 className="max-w-[790px] text-[3.5rem] font-extrabold leading-[.98] tracking-[-.06em] sm:text-[4.75rem] lg:text-[5.5rem]">
            Going home?
            <span className="block text-[#5EA5FF]">Find someone already going your way.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
            Vaya connects passengers with verified drivers travelling between cities, towns and provinces. Compare the route, departure time, fare, pickup point and luggage space before you book.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#download"
              className="group inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#1877F2] px-5 py-3 text-[13px] font-bold text-white shadow-[0_16px_40px_rgba(24,119,242,.30)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#2D86F7]">
              Find a trip
              <ArrowRight size={17} className="transition group-hover:translate-x-1" />
            </a>
            <a
              href="#drivers"
              className="inline-flex items-center justify-center rounded-[8px] border border-white/20 bg-white/8 px-5 py-3 text-[13px] font-bold text-white backdrop-blur transition hover:bg-white/12">
              Publish a trip
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-white/68">
            <span className="flex items-center gap-2">
              <BadgeCheck size={17} className="text-[#63A4FF]" />
              Verified drivers
            </span>
            <span className="flex items-center gap-2">
              <Luggage size={17} className="text-[#63A4FF]" />
              Luggage-aware trips
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-[#63A4FF]" />
              Trip records & safety
            </span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto -mb-24 max-w-[1280px] px-5 sm:px-8 lg:px-10">
        <div className="border border-[#DADDE1] bg-white text-[#050505] shadow-[0_28px_70px_rgba(0,0,0,.18)]">
          <div className="flex flex-col border-b border-[#E4E6EB] md:flex-row md:items-center md:justify-between">
            <div className="flex">
              <button className="border-b-2 border-[#1877F2] px-5 py-3 text-[13px] font-bold text-[#1877F2]">
                Long distance
              </button>
              <button className="px-5 py-3 text-[13px] font-semibold text-[#65676B]">
                Local ride
                <span className="ml-2 text-[9px] font-black uppercase tracking-wide text-[#8A8D91]">Coming soon</span>
              </button>
            </div>
            <div className="px-6 pb-4 text-xs font-semibold text-[#8A8D91] md:pb-0">
              Search trips across South Africa
            </div>
          </div>

          <div className="grid divide-y divide-[#E4E6EB] lg:grid-cols-[1.2fr_1.2fr_.9fr_.8fr_auto] lg:divide-x lg:divide-y-0">
            <button className="flex min-h-[72px] items-center gap-4 px-5 text-left transition hover:bg-[#F7F8FA]">
              <span className="grid h-10 w-10 place-items-center rounded-[8px] bg-[#F0F2F5] text-[#65676B]">
                <MapPin size={17} />
              </span>
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[.12em] text-[#8A8D91]">From</span>
                <span className="mt-1 block text-[13px] font-bold">Johannesburg, Gauteng</span>
              </span>
            </button>

            <button className="flex min-h-[72px] items-center gap-4 px-5 text-left transition hover:bg-[#F7F8FA]">
              <span className="grid h-10 w-10 place-items-center rounded-[8px] bg-[#E7F3FF] text-[#1877F2]">
                <MapPin size={17} />
              </span>
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[.12em] text-[#8A8D91]">To</span>
                <span className="mt-1 block text-[13px] font-bold">Durban, KwaZulu-Natal</span>
              </span>
            </button>

            <button className="flex min-h-[72px] items-center gap-4 px-5 text-left transition hover:bg-[#F7F8FA]">
              <CalendarDays size={18} className="text-[#1877F2]" />
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[.12em] text-[#8A8D91]">Date</span>
                <span className="mt-1 block text-[13px] font-bold">Travel date</span>
              </span>
            </button>

            <button className="flex min-h-[72px] items-center gap-4 px-5 text-left transition hover:bg-[#F7F8FA]">
              <Users size={18} className="text-[#1877F2]" />
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[.12em] text-[#8A8D91]">Seats</span>
                <span className="mt-1 block text-[13px] font-bold">1 passenger</span>
              </span>
            </button>

            <button className="m-3 flex min-h-[50px] items-center justify-center gap-2 rounded-[8px] bg-[#1877F2] px-6 text-[13px] font-bold text-white transition hover:bg-[#166FE5]">
              Search trips <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
