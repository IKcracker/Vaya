import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CarFront,
  Check,
  GraduationCap,
  Luggage,
  MapPinned,
  Navigation,
  Route,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

const driverBanner =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&fm=jpg&q=86&w=2200";

const travelOptions = [
  {
    icon: Route,
    title: "Long-distance shared",
    copy: "Find drivers already travelling between cities, towns and home destinations.",
  },
  {
    icon: GraduationCap,
    title: "Student travel",
    copy: "Plan trips around campus closing periods and make luggage capacity part of the booking.",
  },
  {
    icon: Users,
    title: "Family & group travel",
    copy: "Search for enough seats when several people are travelling together on the same route.",
  },
  {
    icon: CarFront,
    title: "Local rides",
    copy: "Short-distance ride requests will join Vaya after the long-distance marketplace launches.",
  },
];

const routes = [
  ["Pretoria", "Polokwane", "Long distance"],
  ["Johannesburg", "Thohoyandou", "Long distance"],
  ["Pretoria", "Giyani", "Long distance"],
  ["Polokwane", "Midrand", "Route segment"],
];

export function ProductSections() {
  return (
    <>
      <section id="how-it-works" className="bg-white pb-24 pt-28">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">Designed around real journeys</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-.045em] text-[#050505] sm:text-5xl">
              Travel options for the way people already move.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#65676B]">
              Vaya turns the trips people already organise through WhatsApp, Facebook and word of mouth into one structured booking experience.
            </p>
          </div>

          <div id="riders" className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {travelOptions.map(({ icon: Icon, title, copy }, index) => (
              <article
                key={title}
                className="group rounded-[22px] border border-[#E4E6EB] bg-white p-5 shadow-[0_8px_28px_rgba(20,40,80,.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(20,40,80,.09)]">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                    <Icon size={20} />
                  </span>
                  {index === 3 ? (
                    <span className="rounded-full bg-[#F0F2F5] px-2.5 py-1 text-[10px] font-black text-[#8A8D91]">COMING SOON</span>
                  ) : null}
                </div>
                <h3 className="mt-7 text-lg font-black text-[#050505]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#65676B]">{copy}</p>
                <button className="mt-7 inline-flex items-center gap-1 text-xs font-black text-[#1877F2]">
                  Learn more <ArrowRight size={13} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0B1220] py-24 text-white">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-5 sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:px-10">
          <div className="relative min-h-[500px] overflow-hidden rounded-[28px]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("${driverBanner}")` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-[#0B1220]/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#74AEFF]">Built for confidence</p>
              <h3 className="mt-3 max-w-md text-3xl font-black tracking-[-.04em]">See the trip before you say yes.</h3>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#74AEFF]">Why choose Vaya</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-.045em] sm:text-5xl">
              More clarity before the journey starts.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/65">
              Long-distance travel is easier when the driver, route, luggage space and pickup plan are visible before you commit.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                [BadgeCheck, "Verified drivers", "Identity, licence and vehicle details are reviewed before trip publishing."],
                [Luggage, "Luggage visibility", "Know whether your bags will fit before confirming your seat."],
                [Navigation, "Route matching", "Match against the route and supported pickup or drop-off points."],
                [ShieldCheck, "Recorded journeys", "Bookings, trip status and reports stay connected to the journey."],
              ].map(([Icon, title, copy]) => {
                const FeatureIcon = Icon as typeof BadgeCheck;
                return (
                  <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <FeatureIcon size={20} className="text-[#63A4FF]" />
                    <div className="mt-4 text-sm font-black">{String(title)}</div>
                    <div className="mt-2 text-xs leading-5 text-white/50">{String(copy)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8FA] py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">Popular corridors</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-.045em] text-[#050505] sm:text-5xl">
              Start with the route you already know.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#65676B]">
              Vaya is built to support full journeys and useful route segments, not only exact start-to-end matches.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {routes.map(([from, to, type]) => (
              <article key={from + to} className="rounded-[20px] border border-[#E4E6EB] bg-white p-5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                  <MapPinned size={18} />
                </div>
                <div className="mt-6 text-[11px] font-black uppercase tracking-[.12em] text-[#8A8D91]">{type}</div>
                <h3 className="mt-2 text-lg font-black text-[#050505]">{from}</h3>
                <div className="my-3 h-px bg-[#E4E6EB]" />
                <h3 className="text-lg font-black text-[#050505]">{to}</h3>
                <button className="mt-6 inline-flex items-center gap-1 text-xs font-black text-[#1877F2]">
                  Search route <ArrowRight size={13} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="bg-white py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">Safety first</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-.045em] text-[#050505] sm:text-5xl">
                Trust is part of the product.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#65676B]">
                Vaya&apos;s safety model starts before a driver can publish a trip and continues through booking, journey history and reporting.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[24px] border border-[#E4E6EB] bg-[#E4E6EB] sm:grid-cols-2">
              {[
                ["Identity review", "Driver identity details checked before approval"],
                ["Licence review", "Valid driver licence information attached to the account"],
                ["Vehicle review", "Vehicle details linked to the approved driver profile"],
                ["Trip records", "Confirmed bookings remain connected to the trip history"],
              ].map(([title, copy]) => (
                <div key={title} className="bg-white p-6">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                    <Check size={16} />
                  </span>
                  <div className="mt-5 text-sm font-black text-[#050505]">{title}</div>
                  <div className="mt-2 text-xs leading-5 text-[#65676B]">{copy}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="drivers" className="bg-white pb-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div
            className="relative overflow-hidden rounded-[28px] bg-cover bg-center px-6 py-16 text-white sm:px-10 lg:px-14"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(7,16,32,.94) 0%, rgba(7,16,32,.72) 55%, rgba(7,16,32,.30) 100%), url("${driverBanner}")`,
            }}>
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-black backdrop-blur">
                <BriefcaseBusiness size={14} className="text-[#74AEFF]" />
                DRIVE WITH VAYA
              </div>
              <h2 className="mt-6 text-4xl font-black tracking-[-.045em] sm:text-5xl">
                Already going there? Make the empty seats useful.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">
                Publish your route, departure time, available seats, luggage capacity and your own fare. Matching passengers can then find your trip.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Set your own price per seat",
                  "Choose pickup and drop-off points",
                  "Control seats and luggage capacity",
                  "Manage passengers before departure",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-semibold text-white/78">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#1877F2] text-white">
                      <Check size={13} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <a
                href="#download"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-6 py-4 text-sm font-black text-white transition hover:bg-[#2D86F7]">
                Become a driver <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="download" className="border-y border-[#E4E6EB] bg-[#F7F8FA] py-24">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-5 sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:px-10">
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute left-0 top-14 w-[58%] rotate-[-4deg] rounded-[34px] border-[7px] border-[#0B1220] bg-white p-3 shadow-[0_24px_60px_rgba(20,40,80,.18)]">
              <div className="rounded-[24px] bg-[#F0F2F5] p-4">
                <div className="text-xl font-black text-[#1877F2]">vaya</div>
                <div className="mt-5 rounded-2xl bg-white p-4">
                  <div className="text-[10px] font-black uppercase tracking-[.12em] text-[#1877F2]">Your route</div>
                  <div className="mt-2 text-sm font-black">Polokwane → Pretoria</div>
                  <div className="mt-5 h-24 rounded-xl bg-[#E7F3FF]" />
                  <div className="mt-4 rounded-full bg-[#1877F2] py-3 text-center text-xs font-black text-white">Find rides</div>
                </div>
              </div>
            </div>

            <div className="ml-auto w-[58%] rotate-[4deg] rounded-[34px] border-[7px] border-[#0B1220] bg-white p-3 shadow-[0_24px_60px_rgba(20,40,80,.18)]">
              <div className="rounded-[24px] bg-[#F0F2F5] p-4">
                <div className="text-xl font-black text-[#1877F2]">vaya</div>
                <div className="mt-5 rounded-2xl bg-white p-4">
                  <div className="text-[10px] font-black uppercase tracking-[.12em] text-[#1877F2]">Driver mode</div>
                  <div className="mt-2 text-sm font-black">Pretoria → Polokwane</div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-[#F7F8FA] p-3 text-center text-[10px] font-bold">3 seats</div>
                    <div className="rounded-xl bg-[#F7F8FA] p-3 text-center text-[10px] font-bold">R280</div>
                  </div>
                  <div className="mt-4 rounded-full bg-[#1877F2] py-3 text-center text-xs font-black text-white">Publish trip</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E7F3FF] px-3 py-2 text-xs font-black text-[#1877F2]">
              <Smartphone size={14} />
              VAYA MOBILE APP
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-[-.045em] text-[#050505] sm:text-5xl">
              Your trip, in your pocket.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#65676B]">
              Search, book, publish and manage journeys from the Vaya app. Android and iPhone releases will be linked here when the first public build is ready.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                "Search and compare rides",
                "Manage bookings",
                "Publish driver trips",
                "Receive trip updates",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-[#344054]">
                  <Check size={15} className="text-[#1877F2]" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="min-w-[190px] rounded-xl bg-[#0B1220] px-5 py-3.5 text-white">
                <div className="text-[9px] font-bold uppercase tracking-[.12em] text-white/50">Coming soon on</div>
                <div className="mt-1 text-sm font-black">Google Play</div>
              </div>
              <div className="min-w-[190px] rounded-xl bg-[#0B1220] px-5 py-3.5 text-white">
                <div className="text-[9px] font-bold uppercase tracking-[.12em] text-white/50">Coming soon on</div>
                <div className="mt-1 text-sm font-black">App Store</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#1877F2]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-white/65">Ready for the road?</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-white">Plan the journey before travel day.</h2>
          </div>
          <a href="#download" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-[#1877F2]">
            Get Vaya <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <footer className="bg-[#0B1220] text-white">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end lg:px-10">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#1877F2] font-black text-white">V</span>
              <span className="text-xl font-black tracking-[-1px]">vaya</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/45">
              Long-distance shared travel with more clarity around drivers, routes, seats and luggage.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-white/55">
            <a href="#how-it-works" className="hover:text-white">How it works</a>
            <a href="#riders" className="hover:text-white">Ride options</a>
            <a href="#drivers" className="hover:text-white">Drivers</a>
            <a href="#safety" className="hover:text-white">Safety</a>
          </div>

          <div className="border-t border-white/10 pt-6 text-xs text-white/35 md:col-span-2">
            © 2026 Vaya. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
