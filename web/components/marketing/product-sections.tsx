import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  Check,
  Luggage,
  MapPin,
  Route,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

const passengerImage =
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&fm=jpg&q=86&w=1800";

const driverImage =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&fm=jpg&q=86&w=2200";

const routes = [
  { from: "Pretoria", to: "Polokwane", type: "Direct corridor" },
  { from: "Johannesburg", to: "Thohoyandou", type: "Long distance" },
  { from: "Pretoria", to: "Giyani", type: "Long distance" },
  { from: "Polokwane", to: "Midrand", type: "Route segment" },
];

export function ProductSections() {
  return (
    <>
      <section id="how-it-works" className="bg-white pb-28 pt-44">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.18em] text-[#1877F2]">
                <span className="h-px w-8 bg-[#1877F2]" />
                How Vaya works
              </div>
              <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.05em] text-[#050505] sm:text-5xl">
                Everything you need to decide before the road starts.
              </h2>
            </div>

            <p className="max-w-2xl text-lg leading-8 text-[#65676B]">
              The biggest problem with informal long-distance ride sharing is uncertainty. Vaya makes the important details visible before anyone commits: who is driving, where the trip goes, when it leaves, how much it costs and whether your luggage fits.
            </p>
          </div>

          <div className="mt-16 grid border-y border-[#E4E6EB] lg:grid-cols-4 lg:divide-x lg:divide-[#E4E6EB]">
            {[
              ["01", "Search the route", "Choose where you are leaving from, where you are going and your travel date."],
              ["02", "Compare the options", "Review available drivers, times, prices, stops and luggage capacity."],
              ["03", "Reserve your seat", "Choose the trip that suits you and keep the booking details together."],
              ["04", "Travel with clarity", "Pickup information and trip status stay connected to the journey."],
            ].map(([step, title, copy]) => (
              <div key={step} className="border-b border-[#E4E6EB] py-8 lg:border-b-0 lg:px-7 first:lg:pl-0 last:lg:pr-0">
                <div className="text-xs font-black tracking-[.14em] text-[#1877F2]">{step}</div>
                <h3 className="mt-5 text-xl font-black tracking-[-.025em] text-[#050505]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#65676B]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="riders" className="bg-[#F0F2F5]">
        <div className="mx-auto grid max-w-[1280px] lg:grid-cols-2">
          <div
            className="min-h-[560px] bg-cover bg-center"
            style={{ backgroundImage: `url("${passengerImage}")` }}
          />

          <div className="flex items-center px-5 py-20 sm:px-8 lg:px-16">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.18em] text-[#1877F2]">
                <span className="h-px w-8 bg-[#1877F2]" />
                For riders
              </div>

              <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.05em] text-[#050505] sm:text-5xl">
                The trip should make sense before you book it.
              </h2>

              <p className="mt-6 text-lg leading-8 text-[#65676B]">
                Instead of asking the same questions in a WhatsApp group, see the practical details in one place and choose the journey that actually works for you.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  ["Driver", "See who is driving and whether the account is verified."],
                  ["Route", "Understand pickup, destination and intermediate stops."],
                  ["Price", "Compare the fare per seat before reserving."],
                  ["Luggage", "Know the available boot capacity before travel day."],
                ].map(([title, copy]) => (
                  <div key={title} className="grid grid-cols-[92px_1fr] gap-4 border-t border-[#DADDE1] pt-5">
                    <div className="text-sm font-black text-[#050505]">{title}</div>
                    <div className="text-sm leading-6 text-[#65676B]">{copy}</div>
                  </div>
                ))}
              </div>

              <a href="#download" className="mt-9 inline-flex items-center gap-2 text-sm font-black text-[#1877F2]">
                Get the rider app <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.18em] text-[#1877F2]">
                <span className="h-px w-8 bg-[#1877F2]" />
                Route intelligence
              </div>
              <h2 className="mt-5 text-4xl font-extrabold tracking-[-.045em] text-[#050505]">
                Not every passenger starts where the driver starts.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#65676B]">
                Vaya is designed around the route, not only the exact origin and destination. A passenger can match with a useful segment when pickup and drop-off points align.
              </p>
            </div>

            <div className="border-t border-[#E4E6EB]">
              {routes.map((route, index) => (
                <div
                  key={route.from + route.to}
                  className="grid gap-4 border-b border-[#E4E6EB] py-6 sm:grid-cols-[52px_1fr_auto] sm:items-center">
                  <div className="text-xs font-black text-[#8A8D91]">{String(index + 1).padStart(2, "0")}</div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-[#050505]">{route.from}</span>
                    <span className="h-px w-8 bg-[#CCD0D5]" />
                    <MapPin size={15} className="text-[#1877F2]" />
                    <span className="font-black text-[#050505]">{route.to}</span>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <span className="text-xs font-semibold text-[#8A8D91]">{route.type}</span>
                    <ArrowRight size={16} className="text-[#1877F2]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="bg-[#0B1220] py-24 text-white">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.18em] text-[#63A4FF]">
                <span className="h-px w-8 bg-[#1877F2]" />
                Safety by design
              </div>
              <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.05em] sm:text-5xl">
                Trust starts before a driver can publish.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/62">
                Safety is not a badge added at the end. Driver approval, vehicle details and trip records are part of the core operating model.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              {[
                [BadgeCheck, "Driver verification", "Identity and licence information reviewed before trip publishing access."],
                [CarFront, "Vehicle information", "Approved driver profiles are connected to the vehicle used for the journey."],
                [Route, "Recorded trips", "Confirmed bookings stay attached to the journey and its status."],
                [ShieldCheck, "Reporting", "Safety reports can be tied back to the trip, passenger and driver involved."],
              ].map(([Icon, title, copy]) => {
                const FeatureIcon = Icon as typeof BadgeCheck;
                return (
                  <div key={String(title)} className="border-t border-white/15 pt-6">
                    <FeatureIcon size={21} className="text-[#63A4FF]" />
                    <h3 className="mt-4 text-base font-black">{String(title)}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/48">{String(copy)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="drivers" className="bg-white py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid overflow-hidden border border-[#E4E6EB] lg:grid-cols-[.95fr_1.05fr]">
            <div className="flex items-center bg-[#1877F2] px-6 py-16 text-white sm:px-10 lg:px-14">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.18em] text-white/70">
                  <span className="h-px w-8 bg-white/60" />
                  Drive with Vaya
                </div>

                <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.05em] sm:text-5xl">
                  Already making the trip? Put the empty seats to work.
                </h2>

                <p className="mt-6 text-lg leading-8 text-white/76">
                  Publish where you are going, when you leave, how many passengers you can take, the luggage capacity and your fare per seat.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    "Set your own fare",
                    "Choose route stops",
                    "Control seat capacity",
                    "Manage bookings",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm font-semibold text-white/85">
                      <Check size={15} />
                      {item}
                    </div>
                  ))}
                </div>

                <a
                  href="#download"
                  className="mt-9 inline-flex items-center gap-2 rounded-[6px] bg-white px-4 py-2.5 text-[13px] font-bold text-[#1877F2]">
                  Become a driver <ArrowRight size={16} />
                </a>
              </div>
            </div>

            <div
              className="min-h-[540px] bg-cover bg-center"
              style={{ backgroundImage: `url("${driverImage}")` }}
            />
          </div>
        </div>
      </section>

      <section id="download" className="bg-[#F0F2F5] py-24">
        <div className="mx-auto grid max-w-[1280px] gap-14 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-10">
          <div className="relative min-h-[520px]">
            <div className="absolute left-[6%] top-[8%] w-[54%] rotate-[-5deg] border-[8px] border-[#0B1220] bg-white shadow-[0_30px_70px_rgba(20,40,80,.18)]">
              <div className="bg-[#F7F8FA] p-5">
                <div className="text-2xl font-black text-[#1877F2]">vaya</div>
                <div className="mt-7 border border-[#E4E6EB] bg-white p-4">
                  <div className="text-[10px] font-black uppercase tracking-[.12em] text-[#1877F2]">Find a ride</div>
                  <div className="mt-3 text-base font-black">Polokwane → Pretoria</div>
                  <div className="mt-5 space-y-2">
                    <div className="h-11 bg-[#F0F2F5]" />
                    <div className="h-11 bg-[#F0F2F5]" />
                  </div>
                  <div className="mt-4 bg-[#1877F2] py-3 text-center text-xs font-black text-white">Search rides</div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-[6%] right-[4%] w-[54%] rotate-[5deg] border-[8px] border-[#0B1220] bg-white shadow-[0_30px_70px_rgba(20,40,80,.18)]">
              <div className="bg-[#F7F8FA] p-5">
                <div className="text-2xl font-black text-[#1877F2]">vaya</div>
                <div className="mt-7 border border-[#E4E6EB] bg-white p-4">
                  <div className="text-[10px] font-black uppercase tracking-[.12em] text-[#1877F2]">Driver trip</div>
                  <div className="mt-3 text-base font-black">Pretoria → Polokwane</div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="bg-[#F0F2F5] p-3 text-center text-[10px] font-bold">3 seats</div>
                    <div className="bg-[#F0F2F5] p-3 text-center text-[10px] font-bold">R280</div>
                  </div>
                  <div className="mt-4 bg-[#1877F2] py-3 text-center text-xs font-black text-white">Manage trip</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.18em] text-[#1877F2]">
              <span className="h-px w-8 bg-[#1877F2]" />
              Vaya mobile app
            </div>

            <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.05em] text-[#050505] sm:text-5xl">
              Search. Book. Publish. Travel.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#65676B]">
              Vaya is being built mobile-first for passengers and drivers. The public Android and iPhone download links will appear here when the first store release is ready.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                [Smartphone, "Passenger app", "Search routes, compare rides and manage bookings."],
                [CarFront, "Driver mode", "Publish journeys and manage passengers from the same platform."],
              ].map(([Icon, title, copy]) => {
                const AppIcon = Icon as typeof Smartphone;
                return (
                  <div key={String(title)} className="border-t border-[#CCD0D5] pt-5">
                    <AppIcon size={20} className="text-[#1877F2]" />
                    <h3 className="mt-4 text-sm font-black text-[#050505]">{String(title)}</h3>
                    <p className="mt-2 text-xs leading-5 text-[#65676B]">{String(copy)}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <div className="min-w-[180px] bg-[#0B1220] px-4 py-3.5 text-white">
                <div className="text-[9px] font-bold uppercase tracking-[.12em] text-white/48">Coming soon on</div>
                <div className="mt-1 text-sm font-black">Google Play</div>
              </div>
              <div className="min-w-[180px] bg-[#0B1220] px-4 py-3.5 text-white">
                <div className="text-[9px] font-bold uppercase tracking-[.12em] text-white/48">Coming soon on</div>
                <div className="mt-1 text-sm font-black">App Store</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#1877F2]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <div className="text-xs font-black uppercase tracking-[.16em] text-white/65">Ready when you are</div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-white">Plan the trip before travel day.</h2>
          </div>
          <a href="#download" className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-white px-4 py-2.5 text-[13px] font-bold text-[#1877F2]">
            Get Vaya <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <footer className="bg-[#0B1220] text-white">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 py-12 md:grid-cols-[1.4fr_.8fr_.8fr]">
            <div>
              <Link href="/" className="inline-flex items-baseline">
                <span className="text-[22px] font-extrabold tracking-[-1px] text-white">vaya</span>
                <span className="ml-0.5 text-[22px] font-black text-[#1877F2]">.</span>
              </Link>
              <p className="mt-4 max-w-sm text-[13px] leading-6 text-white/48">
                A structured way to find and publish shared long-distance trips across South Africa.
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-white/34">Explore</div>
              <div className="mt-4 grid gap-3 text-[13px] font-medium text-white/58">
                <a href="#how-it-works" className="transition hover:text-white">How it works</a>
                <a href="#riders" className="transition hover:text-white">For riders</a>
                <a href="#drivers" className="transition hover:text-white">For drivers</a>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-white/34">Product</div>
              <div className="mt-4 grid gap-3 text-[13px] font-medium text-white/58">
                <a href="#safety" className="transition hover:text-white">Safety</a>
                <a href="#download" className="transition hover:text-white">Mobile app</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-[11px] text-white/28 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 Vaya. All rights reserved.</span>
            <span>Built for shared journeys.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
