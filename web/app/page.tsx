import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Car,
  CheckCircle2,
  Luggage,
  MapPin,
  Navigation,
  ShieldCheck,
  Smartphone,
  Star,
  Users,
} from "lucide-react";

const benefits = [
  {
    icon: Navigation,
    title: "Long-distance rides, planned ahead",
    copy: "Search by destination and travel date, compare available drivers, then choose the trip that suits your route and budget.",
  },
  {
    icon: Luggage,
    title: "Built for real travel",
    copy: "Drivers publish seat and luggage capacity, making Vaya practical for students, workers and anyone travelling with bags.",
  },
  {
    icon: ShieldCheck,
    title: "Verified driver network",
    copy: "Driver identity, licence and vehicle details are reviewed before long-distance trips can be published.",
  },
];

const steps = [
  ["01", "Choose your route", "Enter where you are leaving from, where you are going and when you want to travel."],
  ["02", "Compare rides", "See matching drivers, pickup points, departure times, ratings, prices and luggage space."],
  ["03", "Book and travel", "Reserve the ride that works for you and keep the journey organised in one place."],
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-white text-[#0B1220]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1877F2] text-lg font-black text-white shadow-[0_8px_24px_rgba(24,119,242,.28)]">
              V
            </span>
            <span className="text-2xl font-black tracking-[-1.4px] text-[#1877F2]">vaya</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold text-[#5F6775] md:flex">
            <a href="#how-it-works" className="transition hover:text-[#1877F2]">How it works</a>
            <a href="#safety" className="transition hover:text-[#1877F2]">Safety</a>
            <a href="#drivers" className="transition hover:text-[#1877F2]">For drivers</a>
            <a href="#download" className="transition hover:text-[#1877F2]">Download</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/admin" className="hidden rounded-xl px-4 py-2.5 text-sm font-black text-[#5F6775] transition hover:bg-[#F0F2F5] sm:inline-flex">
              Admin
            </Link>
            <a href="#download" className="rounded-xl bg-[#1877F2] px-4 py-2.5 text-sm font-black text-white shadow-[0_8px_22px_rgba(24,119,242,.2)] transition hover:-translate-y-0.5 hover:bg-[#166FE5]">
              Get Vaya
            </a>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen bg-[linear-gradient(180deg,#F7FAFF_0%,#FFFFFF_75%)] pt-28">
        <div className="absolute -left-36 top-32 h-96 w-96 rounded-full bg-[#1877F2]/8 blur-3xl" />
        <div className="absolute -right-36 top-20 h-[28rem] w-[28rem] rounded-full bg-[#E7F3FF] blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D8E8FF] bg-white px-3.5 py-2 text-xs font-black text-[#1877F2] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1877F2] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1877F2]" />
              </span>
              Built for South African journeys
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-.055em] text-[#0A1020] sm:text-6xl lg:text-[4.7rem]">
              Going far?
              <span className="block text-[#1877F2]">Don&apos;t travel alone.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5F6775] sm:text-xl">
              Vaya connects passengers with verified drivers already travelling the same route. Plan long-distance trips, compare prices, manage luggage and get home without the taxi-rank wait.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#download" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1877F2] px-6 py-4 font-black text-white shadow-[0_14px_32px_rgba(24,119,242,.26)] transition duration-300 hover:-translate-y-1 hover:bg-[#166FE5] hover:shadow-[0_18px_40px_rgba(24,119,242,.32)]">
                Download the app
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </a>
              <a href="#how-it-works" className="inline-flex items-center justify-center rounded-2xl border border-[#DDE3EC] bg-white px-6 py-4 font-black text-[#182033] transition hover:-translate-y-1 hover:border-[#BFD8FA] hover:shadow-lg">
                See how Vaya works
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#5F6775]">
              <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-[#1877F2]" /> Verified drivers</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-[#1877F2]" /> Choose your price</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-[#1877F2]" /> Luggage friendly</span>
            </div>
          </div>

          <div className="animate-fade-up relative mx-auto w-full max-w-[560px]" style={{ animationDelay: "130ms" }}>
            <div className="animate-float absolute -left-5 top-24 z-20 hidden rounded-2xl border border-white/70 bg-white/92 p-4 shadow-[0_18px_50px_rgba(20,50,100,.14)] backdrop-blur md:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#E7F3FF] text-[#1877F2]"><BadgeCheck size={20} /></div>
                <div>
                  <div className="text-xs font-black">Verified drivers</div>
                  <div className="mt-1 text-[11px] text-[#6A7280]">Identity + vehicle checks</div>
                </div>
              </div>
            </div>

            <div className="animate-float-slow absolute -right-3 bottom-24 z-20 hidden rounded-2xl border border-white/70 bg-white/92 p-4 shadow-[0_18px_50px_rgba(20,50,100,.14)] backdrop-blur md:block">
              <div className="text-[11px] font-bold text-[#6A7280]">Pretoria → Polokwane</div>
              <div className="mt-1 text-lg font-black text-[#1877F2]">From R250</div>
            </div>

            <div className="relative mx-auto w-[300px] rounded-[42px] border-[8px] border-[#111827] bg-[#F0F2F5] p-2 shadow-[0_35px_90px_rgba(30,60,110,.24)] sm:w-[340px]">
              <div className="overflow-hidden rounded-[31px] bg-[#F0F2F5]">
                <div className="flex items-center justify-between bg-white px-5 pb-3 pt-5">
                  <div>
                    <div className="text-2xl font-black tracking-[-1px] text-[#1877F2]">vaya</div>
                    <div className="text-[10px] text-[#65676B]">Travel further, together.</div>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#E7F3FF] text-xs font-black text-[#1877F2]">ZM</div>
                </div>
                <div className="p-4">
                  <div className="mb-3 grid grid-cols-2 rounded-xl bg-[#E4E6EB] p-1 text-center text-[11px] font-black">
                    <div className="rounded-lg bg-white py-2 text-[#1877F2]">Long distance</div>
                    <div className="py-2 text-[#65676B]">Local ride</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="text-lg font-black">Where are you going?</div>
                    <div className="mt-1 text-[11px] text-[#65676B]">Find drivers already travelling your route.</div>
                    {["Polokwane", "Pretoria"].map((place, i) => (
                      <div key={place} className="mt-3 flex items-center gap-2 rounded-xl border border-[#E4E6EB] bg-[#F7F8FA] px-3 py-3 text-xs font-bold text-[#343A46]">
                        <MapPin size={13} className={i === 0 ? "text-[#65676B]" : "text-[#1877F2]"} />
                        {place}
                      </div>
                    ))}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[#F7F8FA] p-3 text-[10px] text-[#65676B]">12 Dec 2026</div>
                      <div className="rounded-xl bg-[#F7F8FA] p-3 text-[10px] text-[#65676B]">1 passenger</div>
                    </div>
                    <div className="mt-3 rounded-xl bg-[#1877F2] py-3 text-center text-xs font-black text-white">Find rides</div>
                  </div>

                  <div className="mt-4 text-sm font-black">Popular routes</div>
                  {[
                    ["Pretoria → Polokwane", "R250"],
                    ["Johannesburg → Thohoyandou", "R350"],
                  ].map(([route, price]) => (
                    <div key={route} className="mt-2 flex items-center justify-between rounded-xl bg-white p-3">
                      <div>
                        <div className="text-[10px] font-black">{route}</div>
                        <div className="mt-1 text-[9px] text-[#65676B]">Verified drivers available</div>
                      </div>
                      <div className="text-[10px] font-black text-[#1877F2]">{price}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#F7F9FC] py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#1877F2]">One trip, less stress</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">Long-distance travel made simple.</h2>
            <p className="mt-5 text-lg leading-8 text-[#667080]">No scrolling through Facebook groups. No waiting indefinitely for a taxi to fill up. See the journey before you leave.</p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map(([number, title, copy], index) => (
              <article key={title} className="group rounded-3xl border border-[#E7EBF1] bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,.03)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_20px_44px_rgba(26,61,110,.1)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#1877F2]">{number}</span>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E7F3FF] text-[#1877F2] transition duration-300 group-hover:rotate-6 group-hover:scale-110">
                    {index === 0 ? <MapPin size={20} /> : index === 1 ? <Users size={20} /> : <Car size={20} />}
                  </span>
                </div>
                <h3 className="mt-8 text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#667080]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {benefits.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-3xl border border-[#E8ECF2] bg-white p-7">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E7F3FF] text-[#1877F2]"><Icon size={22} /></div>
                <h3 className="mt-6 text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#667080]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="bg-[#0C1730] py-24 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#7DB7FF]">Safety first</p>
            <h2 className="mt-4 max-w-xl text-4xl font-black tracking-[-.045em] sm:text-5xl">Trust should be part of the route.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#B7C3D8]">Vaya is designed around verified driver accounts, vehicle checks, trip records and ratings so passengers can make informed choices before travelling.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Driver verification", BadgeCheck],
              ["Vehicle approval", Car],
              ["Trip history", Navigation],
              ["Ratings & reviews", Star],
            ].map(([label, Icon]) => {
              const FeatureIcon = Icon as typeof ShieldCheck;
              return (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/6 p-5 transition hover:-translate-y-1 hover:bg-white/10">
                  <FeatureIcon size={23} className="text-[#7DB7FF]" />
                  <div className="mt-4 font-black">{String(label)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="drivers" className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="overflow-hidden rounded-[36px] bg-[#E7F3FF] p-8 sm:p-12 lg:p-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_.8fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-[#1877F2]"><BriefcaseBusiness size={14} /> For drivers</div>
                <h2 className="mt-6 text-4xl font-black tracking-[-.045em] sm:text-5xl">Already going there? Make the trip pay.</h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[#536175]">Publish where you are going, when you leave, how many seats are available, your luggage capacity and your own price. Vaya helps matching passengers find you.</p>
                <a href="#download" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#1877F2] px-5 py-4 font-black text-white transition hover:-translate-y-1 hover:shadow-xl">
                  Become a Vaya driver <ArrowRight size={17} />
                </a>
              </div>

              <div className="grid gap-3">
                {["Choose your route and departure time", "Set your own seat price", "Control seats and luggage capacity", "Manage passengers in one place"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-white p-4 font-bold shadow-sm">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]"><CheckCircle2 size={17} /></span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="download" className="bg-[#F7F9FC] py-24">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[#1877F2] text-white shadow-[0_14px_32px_rgba(24,119,242,.28)]"><Smartphone size={28} /></div>
          <h2 className="mt-7 text-4xl font-black tracking-[-.045em] sm:text-5xl">Vaya is coming to your phone.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#667080]">The passenger and driver experience is being built for Android and iOS with Expo and React Native. App Store and Google Play download links will appear here once the first release is published.</p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="flex min-w-[210px] items-center gap-3 rounded-2xl bg-[#111827] px-5 py-3.5 text-left text-white opacity-90">
              <span className="text-2xl">▶</span>
              <div><div className="text-[10px] uppercase tracking-wide text-white/70">Coming soon on</div><div className="font-black">Google Play</div></div>
            </div>
            <div className="flex min-w-[210px] items-center gap-3 rounded-2xl bg-[#111827] px-5 py-3.5 text-left text-white opacity-90">
              <span className="text-2xl">●</span>
              <div><div className="text-[10px] uppercase tracking-wide text-white/70">Coming soon on</div><div className="font-black">App Store</div></div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E9EDF2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-black tracking-[-1px] text-[#1877F2]">vaya</div>
            <div className="mt-1 text-xs text-[#77808E]">Travel further, together.</div>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-bold text-[#667080]">
            <a href="#how-it-works" className="hover:text-[#1877F2]">How it works</a>
            <a href="#safety" className="hover:text-[#1877F2]">Safety</a>
            <a href="#drivers" className="hover:text-[#1877F2]">Drivers</a>
            <Link href="/admin" className="hover:text-[#1877F2]">Admin</Link>
          </div>
          <div className="text-xs text-[#8A929F]">© 2026 Vaya. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
