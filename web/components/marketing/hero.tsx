import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  ChevronRight,
  Clock3,
  Luggage,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

const quickRoutes = [
  "Johannesburg → Durban",
  "Cape Town → Gqeberha",
  "Polokwane → Pretoria",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-16">
      <div className="absolute inset-x-0 top-16 h-[520px] bg-[radial-gradient(circle_at_78%_22%,rgba(24,119,242,.13),transparent_34%),radial-gradient(circle_at_18%_6%,rgba(24,119,242,.07),transparent_28%)]" />

      <div className="relative mx-auto grid max-w-[1280px] gap-14 px-5 pb-16 pt-14 sm:px-8 sm:pt-18 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:px-10 lg:pb-24 lg:pt-20">
        <div className="max-w-[650px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E8FB] bg-[#F5F9FF] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.13em] text-[#1877F2]">
            <Navigation size={13} />
            Shared trips across South Africa
          </div>

          <h1 className="mt-6 text-[3.2rem] font-extrabold leading-[.98] tracking-[-.055em] text-[#101828] sm:text-[4.35rem] lg:text-[4.8rem]">
            Your next trip is already
            <span className="block text-[#1877F2]">going your way.</span>
          </h1>

          <p className="mt-6 max-w-[590px] text-base leading-7 text-[#667085] sm:text-lg sm:leading-8">
            Vaya helps passengers find verified drivers already travelling between cities, towns and provinces. See the route, pickup point, departure time, fare, seats and luggage space before you book.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#download"
              className="inline-flex items-center justify-center gap-2 rounded-[7px] bg-[#1877F2] px-5 py-3 text-[13px] font-bold text-white shadow-[0_12px_28px_rgba(24,119,242,.2)] transition hover:bg-[#166FE5]">
              Get the Vaya app
              <ArrowRight size={16} />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-[7px] border border-[#D0D5DD] bg-white px-5 py-3 text-[13px] font-bold text-[#344054] transition hover:bg-[#F9FAFB]">
              See how it works
            </a>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#EAECF0] pt-6 text-[12px] font-semibold text-[#667085]">
            <span className="flex items-center gap-2">
              <BadgeCheck size={16} className="text-[#1877F2]" />
              Verified drivers
            </span>
            <span className="flex items-center gap-2">
              <Luggage size={16} className="text-[#1877F2]" />
              Luggage-aware trips
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#1877F2]" />
              Trip records
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[.11em] text-[#98A2B3]">Popular routes</span>
            {quickRoutes.map((route) => (
              <a
                key={route}
                href="#routes"
                className="text-[12px] font-semibold text-[#475467] transition hover:text-[#1877F2]">
                {route}
              </a>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[620px] lg:mr-0" aria-label="Illustrative Vaya app preview">
          <div className="absolute -left-8 top-14 hidden h-52 w-52 rounded-full bg-[#E7F3FF] blur-3xl sm:block" />
          <div className="absolute -right-10 bottom-10 hidden h-56 w-56 rounded-full bg-[#F0F2F5] blur-3xl sm:block" />

          <div className="relative ml-auto w-full max-w-[530px] rounded-[26px] border border-[#DDE3EA] bg-[#F7F9FC] p-3 shadow-[0_32px_80px_rgba(16,24,40,.14)] sm:p-4">\n            <div className="mb-2 px-1 text-right text-[9px] font-bold uppercase tracking-[.09em] text-[#98A2B3]">Illustrative app preview</div>
            <div className="overflow-hidden rounded-[19px] border border-[#E4E7EC] bg-white">
              <div className="flex items-center justify-between border-b border-[#EAECF0] px-5 py-4">
                <div className="inline-flex items-baseline">
                  <span className="text-[21px] font-extrabold tracking-[-1px] text-[#101828]">vaya</span>
                  <span className="ml-0.5 text-[21px] font-black text-[#1877F2]">.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden text-right sm:block">
                    <div className="text-[10px] font-bold text-[#101828]">Hi, Thato</div>
                    <div className="text-[9px] text-[#98A2B3]">Ready to travel?</div>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#E7F3FF] text-[11px] font-black text-[#1877F2]">
                    TM
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="text-[11px] font-bold text-[#667085]">Where are you going?</div>
                <div className="mt-2 text-[23px] font-extrabold tracking-[-.035em] text-[#101828]">Find your trip</div>

                <div className="mt-5 rounded-[14px] border border-[#DDE3EA] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,.06)]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-[9px] bg-[#F7F8FA] px-3 py-3">
                      <span className="grid h-8 w-8 place-items-center rounded-[7px] bg-white text-[#1877F2]">
                        <MapPin size={15} />
                      </span>
                      <span>
                        <span className="block text-[9px] font-bold uppercase tracking-[.08em] text-[#98A2B3]">From</span>
                        <span className="mt-0.5 block text-[11px] font-bold text-[#101828]">Johannesburg</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-[9px] bg-[#F7F8FA] px-3 py-3">
                      <span className="grid h-8 w-8 place-items-center rounded-[7px] bg-[#E7F3FF] text-[#1877F2]">
                        <MapPin size={15} />
                      </span>
                      <span>
                        <span className="block text-[9px] font-bold uppercase tracking-[.08em] text-[#98A2B3]">To</span>
                        <span className="mt-0.5 block text-[11px] font-bold text-[#101828]">Durban</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 rounded-[9px] border border-[#EAECF0] px-3 py-2.5 text-[10px] font-semibold text-[#475467]">
                      <CalendarDays size={14} className="text-[#1877F2]" />
                      Fri, 09 Oct
                    </div>
                    <div className="flex items-center gap-2 rounded-[9px] border border-[#EAECF0] px-3 py-2.5 text-[10px] font-semibold text-[#475467]">
                      <Users size={14} className="text-[#1877F2]" />
                      1 passenger
                    </div>
                  </div>

                  <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#1877F2] py-3 text-[11px] font-bold text-white transition hover:bg-[#166FE5]">
                    Search available trips
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[.08em] text-[#98A2B3]">Best match</div>
                    <div className="mt-1 text-[14px] font-extrabold text-[#101828]">Johannesburg → Durban</div>
                  </div>
                  <span className="rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[9px] font-bold text-[#027A48]">3 seats left</span>
                </div>

                <div className="mt-3 rounded-[14px] border border-[#DDE3EA] bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#F0F2F5] text-[11px] font-black text-[#344054]">
                        LM
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#101828]">
                          Lebo Mokoena
                          <BadgeCheck size={13} className="text-[#1877F2]" />
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[9px] text-[#667085]">
                          <Star size={10} className="fill-[#1877F2] text-[#1877F2]" />
                          4.9 · 28 trips
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[15px] font-extrabold text-[#101828]">R280</div>
                      <div className="text-[9px] text-[#98A2B3]">per seat</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-y border-[#EAECF0] py-3">
                    <div>
                      <Clock3 size={13} className="text-[#1877F2]" />
                      <div className="mt-1 text-[9px] text-[#98A2B3]">Leaves</div>
                      <div className="text-[10px] font-bold text-[#344054]">06:30</div>
                    </div>
                    <div>
                      <CarFront size={13} className="text-[#1877F2]" />
                      <div className="mt-1 text-[9px] text-[#98A2B3]">Vehicle</div>
                      <div className="text-[10px] font-bold text-[#344054]">Toyota</div>
                    </div>
                    <div>
                      <Luggage size={13} className="text-[#1877F2]" />
                      <div className="mt-1 text-[9px] text-[#98A2B3]">Luggage</div>
                      <div className="text-[10px] font-bold text-[#344054]">Medium</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-[9px] font-medium text-[#667085]">Pickup: Park Station, JHB</div>
                    <button className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1877F2]">
                      View trip <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 border-t border-[#EAECF0] bg-[#FCFCFD] px-3 py-3 text-center text-[9px] font-semibold text-[#98A2B3]">
                <span className="text-[#1877F2]">Home</span>
                <span>Trips</span>
                <span>Bookings</span>
                <span>Profile</span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-8 -left-3 hidden w-[220px] rounded-[14px] border border-[#DDE3EA] bg-white p-4 shadow-[0_18px_45px_rgba(16,24,40,.14)] sm:block lg:-left-14">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-[.09em] text-[#1877F2]">Driver mode</span>
              <CarFront size={15} className="text-[#1877F2]" />
            </div>
            <div className="mt-2 text-[13px] font-extrabold text-[#101828]">Already going there?</div>
            <p className="mt-1 text-[10px] leading-4 text-[#667085]">Publish your route, seats, fare and luggage space.</p>
            <a href="#drivers" className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#1877F2]">
              Publish a trip <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
