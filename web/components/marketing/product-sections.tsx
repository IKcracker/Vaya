import Link from "next/link";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Car,
  Check,
  Luggage,
  MapPin,
  Navigation,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

export function ProductSections() {
  const riderPoints = [
    "Choose the driver and fare that works for you",
    "See pickup, drop-off and luggage details before booking",
    "Keep long-distance and local trips in one app",
  ];

  const driverPoints = [
    "Publish trips you are already planning to make",
    "Set your own seat price and available capacity",
    "Manage passengers, pickup points and trip status",
  ];

  return (
    <>
      <section id="why-vaya" className="bg-[#F6F8FB] py-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">Why Vaya</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-.045em] sm:text-5xl">A better way to organise the trip home.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-[#667085]">
              Long-distance shared travel already happens every day through WhatsApp groups, Facebook posts and word of mouth. Vaya gives that behaviour a proper place to happen — with routes, seats, luggage, pricing and driver verification built in.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-[#E4E8EF] bg-[#E4E8EF] lg:grid-cols-3">
            {[
              [Navigation, "Plan before travel day", "See who is already travelling your route and when they are leaving."],
              [ShieldCheck, "Know who you are riding with", "Driver and vehicle information is part of the booking decision, not an afterthought."],
              [Luggage, "Bring what the trip requires", "Luggage capacity is visible before you choose a ride, especially for students travelling home."],
            ].map(([Icon, title, copy]) => {
              const FeatureIcon = Icon as typeof Navigation;
              return (
                <article key={String(title)} className="bg-white p-7 sm:p-9">
                  <FeatureIcon size={24} className="text-[#1877F2]" />
                  <h3 className="mt-7 text-xl font-black">{String(title)}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#667085]">{String(copy)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="riders" className="py-24">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-[30px] border border-[#E5EAF1] bg-[#F7F9FC] p-5 shadow-[0_24px_60px_rgba(17,33,62,.08)] sm:p-7">
              <div className="rounded-[24px] bg-white p-5">
                <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#1877F2]">Find a ride</p>
                <div className="mt-5 space-y-3">
                  {[
                    ["From", "Polokwane"],
                    ["To", "Pretoria"],
                    ["Travel date", "Choose a date"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-2xl border border-[#E6EAF0] px-4 py-4">
                      <div>
                        <div className="text-[11px] font-bold text-[#98A2B3]">{label}</div>
                        <div className="mt-1 text-sm font-black">{value}</div>
                      </div>
                      <MapPin size={17} className="text-[#1877F2]" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-center rounded-2xl bg-[#1877F2] py-4 text-sm font-black text-white">
                  Search available rides
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">For riders</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-.045em] sm:text-5xl">Choose the journey, not just the destination.</h2>
            <p className="mt-5 text-lg leading-8 text-[#667085]">
              Vaya lets riders compare the things that actually matter on a long trip — driver, time, route, pickup point, luggage space and price.
            </p>
            <div className="mt-7 space-y-4">
              {riderPoints.map((point) => (
                <div key={point} className="flex gap-3 text-sm font-semibold text-[#344054]">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]"><Check size={14} /></span>
                  <span className="leading-6">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="drivers" className="bg-[#0B1730] py-24 text-white">
        <div className="mx-auto grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-bold text-[#9CC7FF]">
              <BriefcaseBusiness size={14} /> For drivers
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-[-.045em] sm:text-5xl">If you are already going, make the empty seats useful.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#B7C3D8]">
              Drivers publish the trip they are already planning, decide how many passengers they can take and set the fare per seat.
            </p>
            <div className="mt-8 space-y-4">
              {driverPoints.map((point) => (
                <div key={point} className="flex gap-3 text-sm font-semibold text-[#D7E0EC]">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1877F2] text-white"><Check size={14} /></span>
                  <span className="leading-6">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/6 p-5 sm:p-7">
            <div className="rounded-[24px] bg-white p-6 text-[#101828]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[.14em] text-[#1877F2]">Publish trip</div>
                  <h3 className="mt-2 text-2xl font-black">Polokwane → Pretoria</h3>
                  <p className="mt-1 text-sm text-[#667085]">Friday • 06:00</p>
                </div>
                <span className="rounded-full bg-[#E7F3FF] px-3 py-2 text-xs font-black text-[#1877F2]">Verified</span>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  ["Seats", "3 available"],
                  ["Luggage", "Large boot"],
                  ["Fare", "Driver sets price"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#F6F8FB] p-4">
                    <div className="text-[11px] font-bold text-[#98A2B3]">{label}</div>
                    <div className="mt-2 text-sm font-black">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-[#1877F2] py-4 text-center text-sm font-black text-white">Publish trip</div>
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="py-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="grid gap-10 rounded-[34px] border border-[#DCE9FA] bg-[#F2F7FD] p-8 sm:p-12 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1877F2] text-white"><ShieldCheck size={24} /></div>
              <p className="mt-7 text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">Safety architecture</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-.045em]">Verification before the first trip.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#667085]">
                Driver identity, licence and vehicle information will be reviewed before a driver can publish trips. Ratings, trip history, reporting and emergency tools build on top of that foundation.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                ["Identity & licence", "Driver details reviewed before approval"],
                ["Vehicle details", "Registered vehicle information attached to the driver"],
                ["Trip records", "Every booking belongs to a trackable journey"],
                ["Ratings & reports", "Accountability continues after the trip"],
              ].map(([title, copy]) => (
                <div key={title} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E7F3FF] text-[#1877F2]"><Check size={16} /></span>
                  <div>
                    <div className="text-sm font-black">{title}</div>
                    <div className="mt-1 text-xs leading-5 text-[#667085]">{copy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="download" className="border-t border-[#E8ECF2] bg-[#F7F9FC] py-24">
        <div className="mx-auto grid max-w-[1080px] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E7F3FF] px-3 py-2 text-xs font-black text-[#1877F2]"><Smartphone size={14} /> Mobile first</div>
            <h2 className="mt-6 text-4xl font-black tracking-[-.045em] sm:text-5xl">Vaya belongs in your pocket.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#667085]">
              The Android and iOS apps are currently being prepared for release. Store download buttons will become active as soon as the first public build is published.
            </p>
          </div>

          <div className="rounded-[28px] bg-[#0B1730] p-6 text-white shadow-[0_20px_60px_rgba(11,23,48,.18)]">
            <Sparkles size={22} className="text-[#60A5FA]" />
            <h3 className="mt-5 text-xl font-black">Release channels</h3>
            <div className="mt-5 space-y-3">
              {[
                ["Android", "Google Play"],
                ["iPhone", "App Store"],
              ].map(([platform, store]) => (
                <div key={store} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
                  <div>
                    <div className="text-xs text-white/45">{platform}</div>
                    <div className="mt-1 text-sm font-black">{store}</div>
                  </div>
                  <span className="text-xs font-bold text-[#9CC7FF]">Preparing release</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1877F2] font-black text-white">V</span>
            <span className="text-xl font-black tracking-[-1px]">vaya</span>
          </Link>
          <div className="flex flex-wrap gap-5 text-sm font-semibold text-[#667085]">
            <a href="#why-vaya" className="hover:text-[#1877F2]">Why Vaya</a>
            <a href="#riders" className="hover:text-[#1877F2]">Riders</a>
            <a href="#drivers" className="hover:text-[#1877F2]">Drivers</a>
            <a href="#safety" className="hover:text-[#1877F2]">Safety</a>
            <Link href="/admin" className="hover:text-[#1877F2]">Admin</Link>
          </div>
          <p className="text-xs text-[#98A2B3]">© 2026 Vaya</p>
        </div>
      </footer>
    </>
  );
}
