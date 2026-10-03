import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Check,
  Clock3,
  Luggage,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
  Smartphone,
  Star,
  Users,
} from "lucide-react";

const routes = [
  { from: "Johannesburg", to: "Durban", type: "Gauteng → KwaZulu-Natal", fare: "from R250" },
  { from: "Cape Town", to: "Gqeberha", type: "Western Cape → Eastern Cape", fare: "from R320" },
  { from: "Bloemfontein", to: "Johannesburg", type: "Free State → Gauteng", fare: "from R220" },
  { from: "Mbombela", to: "Pretoria", type: "Mpumalanga → Gauteng", fare: "from R190" },
  { from: "Rustenburg", to: "Johannesburg", type: "North West → Gauteng", fare: "from R160" },
  { from: "Kimberley", to: "Bloemfontein", type: "Northern Cape → Free State", fare: "from R210" },
  { from: "Polokwane", to: "Pretoria", type: "Limpopo → Gauteng", fare: "from R180" },
];

const provinces = [
  "Gauteng",
  "KwaZulu-Natal",
  "Western Cape",
  "Eastern Cape",
  "Free State",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Limpopo",
];

export function ProductSections() {
  return (
    <>
      <section id="how-it-works" className="bg-white py-24 sm:py-28">
        <div data-reveal="soft" className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.86fr_1.14fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#1877F2]">
                <span className="h-px w-8 bg-[#1877F2]" />
                How Vaya works
              </div>
              <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.045em] text-[#101828] sm:text-5xl">
                Find the right trip without the guesswork.
              </h2>
            </div>

            <p className="max-w-2xl text-base leading-7 text-[#667085] sm:text-lg sm:leading-8">
              Search the route you need, compare the people already travelling it, reserve your seat and keep the practical details together until you arrive.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[16px] border border-[#E4E7EC] bg-[#E4E7EC] md:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Search your route", "Choose where you are leaving from, where you are going and the day you want to travel."],
              ["02", "Compare your options", "See drivers, departure times, pickup points, fares, seats and luggage space."],
              ["03", "Reserve a seat", "Choose the trip that works for you and keep the booking information in one place."],
              ["04", "Travel with clarity", "Follow the trip details and stay connected to the journey from pickup to arrival."],
            ].map(([step, title, copy]) => (
              <div key={step} className="interactive-card bg-white p-7">
                <div className="text-[11px] font-black tracking-[.14em] text-[#1877F2]">{step}</div>
                <h3 className="mt-8 text-lg font-extrabold tracking-[-.025em] text-[#101828]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#667085]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="riders" className="bg-[#F7F9FC] py-24 sm:py-28">
        <div data-reveal="soft" className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[.88fr_1.12fr] lg:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#1877F2]">
                <span className="h-px w-8 bg-[#1877F2]" />
                For passengers
              </div>
              <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.045em] text-[#101828] sm:text-5xl">
                Know exactly what you are booking.
              </h2>
              <p className="mt-6 text-base leading-7 text-[#667085] sm:text-lg sm:leading-8">
                Whether you are going home, travelling for work, leaving campus or visiting family, Vaya gives you the important trip details before you commit.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  [BadgeCheck, "Verified driver", "See the driver profile and verification status."],
                  [Route, "Clear route", "Understand pickup, destination and useful stops."],
                  [Luggage, "Luggage capacity", "Know how much bag space is available."],
                  [Users, "Seat availability", "See remaining seats before you reserve."],
                ].map(([Icon, title, copy]) => {
                  const FeatureIcon = Icon as typeof BadgeCheck;
                  return (
                    <div key={String(title)} className="interactive-card rounded-[12px] border border-[#E4E7EC] bg-white p-5">
                      <FeatureIcon size={18} className="text-[#1877F2]" />
                      <h3 className="mt-4 text-sm font-extrabold text-[#101828]">{String(title)}</h3>
                      <p className="mt-2 text-xs leading-5 text-[#667085]">{String(copy)}</p>
                    </div>
                  );
                })}
              </div>

              <a href="#download" className="mt-8 inline-flex items-center gap-2 text-[13px] font-extrabold text-[#1877F2]">
                Get the passenger app <ArrowRight size={15} className="arrow-shift" />
              </a>
            </div>

            <div className="relative">
              <div data-reveal="scale" className="pointer-events-none select-none rounded-[22px] border border-[#DDE3EA] bg-white p-4 shadow-[0_24px_70px_rgba(16,24,40,.11)] sm:p-6">
                <div className="mb-3 text-right text-[9px] font-bold uppercase tracking-[.09em] text-[#98A2B3]">Illustrative trip results</div>
                <div className="flex items-center justify-between border-b border-[#EAECF0] pb-5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[.1em] text-[#98A2B3]">Trip results</div>
                    <div className="mt-1 text-lg font-extrabold text-[#101828]">Johannesburg → Durban</div>
                  </div>
                  <div className="rounded-[8px] bg-[#E7F3FF] px-3 py-2 text-[10px] font-bold text-[#1877F2]">Fri, 09 Oct</div>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    ["LM", "Lebo Mokoena", "06:30", "R280", "Park Station", "3 seats"],
                    ["TN", "Thabo Ndlovu", "08:00", "R260", "Midrand", "2 seats"],
                    ["PM", "Precious Maseko", "14:30", "R300", "Sandton", "1 seat"],
                  ].map(([initials, name, time, price, pickup, seats], index) => (
                    <div key={name} className={`rounded-[13px] border p-4 ${index === 0 ? "border-[#B7D5FA] bg-[#F8FBFF]" : "border-[#E4E7EC] bg-white"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#F0F2F5] text-[11px] font-black text-[#344054]">{initials}</div>
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#101828]">
                              {name}
                              <BadgeCheck size={13} className="text-[#1877F2]" />
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[9px] text-[#667085]">
                              <Star size={10} className="fill-[#1877F2] text-[#1877F2]" />
                              {index === 0 ? "4.9 · 28 trips" : index === 1 ? "4.8 · 17 trips" : "4.9 · 12 trips"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[15px] font-extrabold text-[#101828]">{price}</div>
                          <div className="text-[9px] text-[#98A2B3]">per seat</div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#EAECF0] pt-3 text-[9px] text-[#667085]">
                        <div><Clock3 size={12} className="mb-1 text-[#1877F2]" />{time}</div>
                        <div><MapPin size={12} className="mb-1 text-[#1877F2]" />{pickup}</div>
                        <div><Users size={12} className="mb-1 text-[#1877F2]" />{seats}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -bottom-7 right-5 hidden rounded-[12px] border border-[#DDE3EA] bg-white px-4 py-3 shadow-[0_16px_40px_rgba(16,24,40,.12)] sm:flex sm:items-center sm:gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#E7F3FF] text-[#1877F2]">
                  <Luggage size={16} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#101828]">Luggage confirmed</div>
                  <div className="mt-0.5 text-[9px] text-[#98A2B3]">Medium bag space available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div data-reveal="soft" className="mx-auto grid max-w-[1280px] gap-12 px-5 sm:px-8 lg:grid-cols-[.72fr_1.28fr] lg:px-10">
          <div>
            <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#1877F2]">
              <span className="h-px w-8 bg-[#1877F2]" />
              Everyday journeys
            </div>
            <h2 className="mt-5 text-4xl font-extrabold tracking-[-.045em] text-[#101828]">
              Made for how South Africans actually travel.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#667085]">
              Vaya is not a tourist-transfer site. It is designed around real intercity and interprovincial travel.
            </p>
          </div>

          <div className="border-t border-[#D0D5DD]">
            {[
              ["Going home", "Weekend, month-end and holiday travel back to family or your home town."],
              ["Campus closing", "Students leaving university or college with luggage when residences close."],
              ["Work travel", "Regular travel between the place you live and the city where you work."],
              ["Family visits", "Trips for events, family responsibilities and planned visits in another province."],
            ].map(([title, copy]) => (
              <div key={title} className="grid gap-3 border-b border-[#D0D5DD] py-6 sm:grid-cols-[150px_1fr]">
                <div className="text-sm font-bold text-[#101828]">{title}</div>
                <div className="text-sm leading-6 text-[#667085]">{copy}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="routes" className="bg-[#F7F9FC] py-24">
        <div data-reveal="soft" className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#1877F2]">
                <span className="h-px w-8 bg-[#1877F2]" />
                Across South Africa
              </div>
              <h2 className="mt-5 text-4xl font-extrabold tracking-[-.045em] text-[#101828]">
                One platform for routes across all nine provinces.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#667085]">
                Vaya is designed around useful route segments, so passengers can match with drivers travelling through the places they need.
              </p>
            </div>

            <div>
              <div className="mb-7 flex flex-wrap gap-2">
                {provinces.map((province) => (
                  <span key={province} className="rounded-full border border-[#DDE3EA] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#667085]">
                    {province}
                  </span>
                ))}
              </div>

              <div className="overflow-hidden rounded-[14px] border border-[#E4E7EC] bg-white">
                {routes.map((route, index) => (
                  <div
                    key={route.from + route.to}
                    className="route-row grid gap-4 border-b border-[#E4E7EC] px-5 py-5 last:border-b-0 sm:grid-cols-[38px_1fr_auto] sm:items-center">
                    <div className="text-[10px] font-black text-[#98A2B3]">{String(index + 1).padStart(2, "0")}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-[#101828]">
                        <span>{route.from}</span>
                        <ArrowRight size={14} className="text-[#1877F2]" />
                        <span>{route.to}</span>
                      </div>
                      <div className="mt-1 text-[10px] font-medium text-[#98A2B3]">{route.type}</div>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[.08em] text-[#98A2B3]">Example route</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="drivers" className="bg-white py-24 sm:py-28">
        <div data-reveal="soft" className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[.88fr_1.12fr] lg:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#1877F2]">
                <span className="h-px w-8 bg-[#1877F2]" />
                For drivers
              </div>
              <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.045em] text-[#101828] sm:text-5xl">
                Already making the trip? Put your empty seats to work.
              </h2>
              <p className="mt-6 text-base leading-7 text-[#667085] sm:text-lg sm:leading-8">
                Publish where you are going, when you are leaving, how many passengers you can take, the luggage capacity and your fare per seat.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Set your own fare",
                  "Choose route stops",
                  "Control seat capacity",
                  "Manage passenger bookings",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-semibold text-[#475467]">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                      <Check size={13} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <a
                href="#download"
                className="group button-lift mt-9 inline-flex items-center gap-2 rounded-[7px] bg-[#1877F2] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,.14)] hover:bg-[#166FE5] hover:shadow-[0_12px_28px_rgba(24,119,242,.2)]">
                Become a Vaya driver <ArrowRight size={15} className="arrow-shift" />
              </a>
            </div>

            <div data-reveal="scale" className="pointer-events-none select-none rounded-[22px] border border-[#DDE3EA] bg-[#F7F9FC] p-4 shadow-[0_24px_70px_rgba(16,24,40,.1)] sm:p-6">
              <div className="mb-3 text-right text-[9px] font-bold uppercase tracking-[.09em] text-[#98A2B3]">Illustrative driver preview</div>
              <div className="rounded-[16px] border border-[#E4E7EC] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[.1em] text-[#1877F2]">Publish a trip</div>
                    <div className="mt-1 text-xl font-extrabold text-[#101828]">Where are you going?</div>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#E7F3FF] text-[#1877F2]">
                    <CarFront size={18} />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    [MapPin, "Starting point", "Johannesburg"],
                    [Navigation, "Destination", "Durban"],
                    [CalendarDays, "Departure", "Fri, 09 Oct · 06:30"],
                    [Users, "Available seats", "3 passengers"],
                    [Luggage, "Luggage", "Medium capacity"],
                    [Route, "Fare per seat", "R280"],
                  ].map(([Icon, label, value]) => {
                    const FieldIcon = Icon as typeof MapPin;
                    return (
                      <div key={String(label)} className="interactive-card rounded-[10px] border border-[#E4E7EC] p-3">
                        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.08em] text-[#98A2B3]">
                          <FieldIcon size={12} className="text-[#1877F2]" />
                          {String(label)}
                        </div>
                        <div className="mt-2 text-[11px] font-bold text-[#101828]">{String(value)}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-[10px] bg-[#F7F9FC] p-4">
                  <div className="text-[9px] font-bold uppercase tracking-[.08em] text-[#98A2B3]">Route stops</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-[#475467]">
                    <span>Johannesburg</span>
                    <ArrowRight size={12} className="text-[#1877F2]" />
                    <span>Heidelberg</span>
                    <ArrowRight size={12} className="text-[#1877F2]" />
                    <span>Harrismith</span>
                    <ArrowRight size={12} className="text-[#1877F2]" />
                    <span>Durban</span>
                  </div>
                </div>

                <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#1877F2] py-3 text-[11px] font-bold text-white">
                  Publish trip
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="bg-[#EEF6FF] py-24">
        <div data-reveal="soft" className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#1877F2]">
                <span className="h-px w-8 bg-[#1877F2]" />
                Safety by design
              </div>
              <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.045em] text-[#101828] sm:text-5xl">
                Trust starts before a trip is published.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#667085]">
                Driver approval, vehicle information, booking records and reporting are built into how Vaya operates.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [BadgeCheck, "Driver verification", "Identity and licence details are reviewed before publishing access is enabled."],
                [CarFront, "Vehicle information", "Trips are linked to the approved vehicle being used for that journey."],
                [Route, "Recorded bookings", "Confirmed seats stay connected to the passenger, driver and trip."],
                [ShieldCheck, "Trip reporting", "Safety reports can be tied back to the journey and people involved."],
              ].map(([Icon, title, copy]) => {
                const FeatureIcon = Icon as typeof BadgeCheck;
                return (
                  <div key={String(title)} className="interactive-card rounded-[14px] border border-[#CFE2FA] bg-white p-6">
                    <div className="grid h-9 w-9 place-items-center rounded-[9px] bg-[#E7F3FF] text-[#1877F2]">
                      <FeatureIcon size={17} />
                    </div>
                    <h3 className="mt-5 text-sm font-extrabold text-[#101828]">{String(title)}</h3>
                    <p className="mt-2 text-xs leading-5 text-[#667085]">{String(copy)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="download" className="bg-white py-24 sm:py-28">
        <div data-reveal="soft" className="mx-auto grid max-w-[1280px] gap-14 px-5 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-10">
          <div data-reveal="scale" className="pointer-events-none relative mx-auto min-h-[510px] w-full max-w-[600px] select-none" role="img" aria-label="Illustrative Vaya mobile app previews">
            <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold uppercase tracking-[.09em] text-[#98A2B3]">Illustrative app previews</div>
            <div className="interactive-card absolute left-[4%] top-[4%] w-[56%] rotate-[-4deg] rounded-[28px] border border-[#DDE3EA] bg-[#F7F9FC] p-2.5 shadow-[0_28px_70px_rgba(16,24,40,.14)]">
              <div className="overflow-hidden rounded-[21px] border border-[#E4E7EC] bg-white">
                <div className="px-4 pt-5 text-[18px] font-extrabold tracking-[-1px] text-[#101828]">
                  vaya<span className="text-[#1877F2]">.</span>
                </div>
                <div className="p-4">
                  <div className="text-[9px] font-bold uppercase tracking-[.09em] text-[#1877F2]">Find a trip</div>
                  <div className="mt-2 text-[13px] font-extrabold text-[#101828]">Cape Town → Gqeberha</div>
                  <div className="mt-4 space-y-2">
                    <div className="rounded-[8px] bg-[#F0F2F5] p-3 text-[9px] font-semibold text-[#667085]">Fri, 16 Oct · 07:00</div>
                    <div className="rounded-[8px] bg-[#F0F2F5] p-3 text-[9px] font-semibold text-[#667085]">2 passengers · Medium luggage</div>
                  </div>
                  <div className="mt-4 rounded-[8px] bg-[#1877F2] py-3 text-center text-[9px] font-black text-white">Search rides</div>
                </div>
              </div>
            </div>

            <div className="interactive-card absolute bottom-[2%] right-[3%] w-[56%] rotate-[4deg] rounded-[28px] border border-[#DDE3EA] bg-[#F7F9FC] p-2.5 shadow-[0_28px_70px_rgba(16,24,40,.14)]">
              <div className="overflow-hidden rounded-[21px] border border-[#E4E7EC] bg-white">
                <div className="px-4 pt-5 text-[18px] font-extrabold tracking-[-1px] text-[#101828]">
                  vaya<span className="text-[#1877F2]">.</span>
                </div>
                <div className="p-4">
                  <div className="text-[9px] font-bold uppercase tracking-[.09em] text-[#1877F2]">Driver trip</div>
                  <div className="mt-2 text-[13px] font-extrabold text-[#101828]">Johannesburg → Durban</div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-[8px] bg-[#F0F2F5] p-3 text-center text-[9px] font-bold text-[#475467]">3 seats</div>
                    <div className="rounded-[8px] bg-[#F0F2F5] p-3 text-center text-[9px] font-bold text-[#475467]">R280</div>
                  </div>
                  <div className="mt-4 rounded-[8px] bg-[#1877F2] py-3 text-center text-[9px] font-black text-white">Manage trip</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#1877F2]">
              <span className="h-px w-8 bg-[#1877F2]" />
              Vaya mobile app
            </div>

            <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.045em] text-[#101828] sm:text-5xl">
              Your trips live in one place.
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-[#667085] sm:text-lg sm:leading-8">
              Search, book, publish and manage shared trips from the same Vaya account. The public Android and iPhone download links will appear here when the first store release is ready.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                [Smartphone, "Passenger app", "Search routes, compare drivers and manage your bookings."],
                [CarFront, "Driver mode", "Publish journeys and manage passengers from the same app."],
              ].map(([Icon, title, copy]) => {
                const AppIcon = Icon as typeof Smartphone;
                return (
                  <div key={String(title)} className="rounded-[12px] border border-[#E4E7EC] p-5">
                    <AppIcon size={18} className="text-[#1877F2]" />
                    <h3 className="mt-4 text-sm font-extrabold text-[#101828]">{String(title)}</h3>
                    <p className="mt-2 text-xs leading-5 text-[#667085]">{String(copy)}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="min-w-[170px] rounded-[8px] border border-[#D0D5DD] bg-white px-4 py-3">
                <div className="text-[8px] font-bold uppercase tracking-[.1em] text-[#98A2B3]">Coming soon on</div>
                <div className="mt-1 text-sm font-extrabold text-[#101828]">Google Play</div>
              </div>
              <div className="min-w-[170px] rounded-[8px] border border-[#D0D5DD] bg-white px-4 py-3">
                <div className="text-[8px] font-bold uppercase tracking-[.1em] text-[#98A2B3]">Coming soon on</div>
                <div className="mt-1 text-sm font-extrabold text-[#101828]">App Store</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#1877F2]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.14em] text-white/70">Ready when you are</div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-white">Plan the trip before travel day.</h2>
          </div>
          <a href="#download" className="group button-lift inline-flex items-center justify-center gap-2 rounded-[7px] bg-white px-4 py-2.5 text-[13px] font-bold text-[#1877F2] shadow-[0_8px_20px_rgba(0,0,0,.08)] hover:shadow-[0_12px_28px_rgba(0,0,0,.12)]">
            Get Vaya <ArrowRight size={15} className="arrow-shift" />
          </a>
        </div>
      </section>

      <footer className="border-t border-[#EAECF0] bg-white text-[#101828]">
        <div data-reveal="soft" className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 py-12 md:grid-cols-[1.4fr_.8fr_.8fr]">
            <div>
              <Link href="/" className="inline-flex items-baseline">
                <span className="text-[22px] font-extrabold tracking-[-1px] text-[#101828]">vaya</span>
                <span className="ml-0.5 text-[22px] font-black text-[#1877F2]">.</span>
              </Link>
              <p className="mt-4 max-w-sm text-[13px] leading-6 text-[#667085]">
                Shared interprovincial trips for going home, campus travel, work journeys and family visits across South Africa.
              </p>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-[#98A2B3]">Explore</div>
              <div className="mt-4 grid gap-3 text-[13px] font-medium text-[#667085]">
                <a href="#how-it-works" className="transition hover:text-[#1877F2]">How it works</a>
                <a href="#riders" className="transition hover:text-[#1877F2]">For riders</a>
                <a href="#drivers" className="transition hover:text-[#1877F2]">For drivers</a>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-[#98A2B3]">Product</div>
              <div className="mt-4 grid gap-3 text-[13px] font-medium text-[#667085]">
                <a href="#routes" className="transition hover:text-[#1877F2]">Routes</a>
                <a href="#safety" className="transition hover:text-[#1877F2]">Safety</a>
                <a href="#download" className="transition hover:text-[#1877F2]">Mobile app</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#EAECF0] py-6 text-[11px] text-[#98A2B3] sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 Vaya. All rights reserved.</span>
            <span>Built for shared journeys across South Africa.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
