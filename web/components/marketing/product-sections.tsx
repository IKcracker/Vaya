import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  CarFront,
  Check,
  Clock3,
  Luggage,
  MapPinned,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
} from "lucide-react";

export function ProductSections() {
  return (
    <>
      <section id="how-it-works" className="border-y border-[#E4E6EB] bg-[#F7F8FA] py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">How Vaya works</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-.045em] text-[#050505] sm:text-5xl">
              From search to seat in a few clear steps.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#65676B]">
              No group chats, no guessing, no waiting around. Vaya gives riders the information they need before the journey starts.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {[
              [MapPinned, "01", "Search your route", "Choose where you are leaving from, where you are going and when you want to travel."],
              [UserRoundCheck, "02", "Compare drivers", "Review driver details, departure time, fare, pickup point and available luggage space."],
              [CalendarCheck, "03", "Book your seat", "Reserve the trip that works for you and keep the journey details in one place."],
            ].map(([Icon, step, title, copy]) => {
              const StepIcon = Icon as typeof MapPinned;
              return (
                <article key={String(step)} className="rounded-[24px] border border-[#E4E6EB] bg-white p-7">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#1877F2]">{String(step)}</span>
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                      <StepIcon size={20} />
                    </span>
                  </div>
                  <h3 className="mt-8 text-xl font-black text-[#050505]">{String(title)}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#65676B]">{String(copy)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="riders" className="bg-white py-24">
        <div className="mx-auto grid max-w-[1280px] gap-14 px-5 sm:px-8 lg:px-10 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">For riders</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-.045em] text-[#050505] sm:text-5xl">
              Know what you are booking before you travel.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#65676B]">
              Long-distance trips are easier when the important details are clear up front. Vaya puts route, pickup, price, driver and luggage information in one place.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                "Choose from available drivers on your route",
                "Compare fares and departure times",
                "See pickup and drop-off details before booking",
                "Check luggage capacity before confirming your seat",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm font-semibold text-[#344054]">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                    <Check size={14} />
                  </span>
                  <span className="leading-6">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-[#E4E6EB] bg-[#F7F8FA] p-5 sm:p-7">
            <div className="overflow-hidden rounded-[24px] bg-white">
              <div className="border-b border-[#E4E6EB] px-5 py-5">
                <div className="text-[11px] font-black uppercase tracking-[.14em] text-[#1877F2]">Available ride</div>
                <div className="mt-2 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-[#050505]">Polokwane → Pretoria</h3>
                    <p className="mt-1 text-sm text-[#65676B]">Friday • 06:00</p>
                  </div>
                  <span className="rounded-full bg-[#E7F3FF] px-3 py-2 text-xs font-black text-[#1877F2]">R300</span>
                </div>
              </div>

              <div className="px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#F0F2F5] text-sm font-black text-[#1877F2]">TM</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#050505]">Thabo Mokoena</span>
                      <BadgeCheck size={15} className="text-[#1877F2]" />
                    </div>
                    <div className="mt-1 text-xs text-[#65676B]">Toyota Corolla • Verified driver</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#F7F8FA] p-4">
                    <Clock3 size={17} className="text-[#1877F2]" />
                    <div className="mt-3 text-[11px] text-[#8A8D91]">Departure</div>
                    <div className="mt-1 text-sm font-black">06:00</div>
                  </div>
                  <div className="rounded-2xl bg-[#F7F8FA] p-4">
                    <Luggage size={17} className="text-[#1877F2]" />
                    <div className="mt-3 text-[11px] text-[#8A8D91]">Luggage</div>
                    <div className="mt-1 text-sm font-black">Large boot</div>
                  </div>
                  <div className="rounded-2xl bg-[#F7F8FA] p-4">
                    <CarFront size={17} className="text-[#1877F2]" />
                    <div className="mt-3 text-[11px] text-[#8A8D91]">Seats left</div>
                    <div className="mt-1 text-sm font-black">2 seats</div>
                  </div>
                </div>

                <button className="mt-5 w-full rounded-full bg-[#1877F2] py-3.5 text-sm font-black text-white">
                  View trip
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="drivers" className="bg-[#F7F8FA] py-24">
        <div className="mx-auto grid max-w-[1280px] gap-14 px-5 sm:px-8 lg:px-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="rounded-[30px] border border-[#E4E6EB] bg-white p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#1877F2]">Publish a trip</p>
                  <h3 className="mt-2 text-2xl font-black text-[#050505]">Pretoria → Polokwane</h3>
                  <p className="mt-1 text-sm text-[#65676B]">Sunday • 15:00</p>
                </div>
                <span className="rounded-full bg-[#E7F3FF] px-3 py-2 text-xs font-black text-[#1877F2]">Driver</span>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  ["Seats", "3 available"],
                  ["Fare", "R280 / seat"],
                  ["Luggage", "Medium boot"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[#E4E6EB] p-4">
                    <div className="text-[11px] font-bold text-[#8A8D91]">{label}</div>
                    <div className="mt-2 text-sm font-black text-[#050505]">{value}</div>
                  </div>
                ))}
              </div>

              <button className="mt-5 w-full rounded-full bg-[#1877F2] py-3.5 text-sm font-black text-white">
                Publish trip
              </button>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">For drivers</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-.045em] text-[#050505] sm:text-5xl">
              Already travelling? Make your empty seats useful.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#65676B]">
              Publish the trip you are already planning, set your own fare, choose how many passengers you can take and manage everything from the app.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                "Set your own price per seat",
                "Choose pickup points and intermediate stops",
                "Control available seats and luggage capacity",
                "Manage passenger bookings before departure",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm font-semibold text-[#344054]">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                    <Check size={14} />
                  </span>
                  <span className="leading-6">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="bg-white py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 rounded-[32px] border border-[#D8E8FF] bg-[#F7FAFF] p-8 sm:p-12 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#1877F2] text-white">
                <ShieldCheck size={23} />
              </span>
              <p className="mt-7 text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">Safety first</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-.045em] text-[#050505] sm:text-5xl">
                Trust starts before the trip.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#65676B]">
                Vaya is designed around driver verification, vehicle information, trip history and reporting so riders can make more informed choices before they travel.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                ["Driver identity", "Personal details reviewed before approval"],
                ["Driver licence", "Licence information checked during onboarding"],
                ["Vehicle details", "Vehicle information attached to the driver profile"],
                ["Trip history", "Every confirmed booking belongs to a recorded trip"],
              ].map(([title, copy]) => (
                <div key={title} className="flex gap-4 rounded-2xl bg-white p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                    <Check size={16} />
                  </span>
                  <div>
                    <div className="text-sm font-black text-[#050505]">{title}</div>
                    <div className="mt-1 text-xs leading-5 text-[#65676B]">{copy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="download" className="border-t border-[#E4E6EB] bg-[#F7F8FA] py-24">
        <div className="mx-auto max-w-[1280px] px-5 text-center sm:px-8 lg:px-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
            <Smartphone size={24} />
          </span>
          <p className="mt-6 text-xs font-black uppercase tracking-[.16em] text-[#1877F2]">Download Vaya</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-[-.045em] text-[#050505] sm:text-5xl">
            Your next trip should be easier to organise.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#65676B]">
            Vaya is being prepared for Android and iPhone. Store download links will be added here when the first public release is available.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="min-w-[220px] rounded-2xl border border-[#DADDE1] bg-white px-5 py-4 text-left">
              <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8A8D91]">Coming soon</div>
              <div className="mt-1 text-base font-black text-[#050505]">Google Play</div>
            </div>
            <div className="min-w-[220px] rounded-2xl border border-[#DADDE1] bg-white px-5 py-4 text-left">
              <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8A8D91]">Coming soon</div>
              <div className="mt-1 text-base font-black text-[#050505]">App Store</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#1877F2] font-black text-white">V</span>
            <span className="text-xl font-black tracking-[-1px] text-[#050505]">vaya</span>
          </Link>

          <div className="flex flex-wrap gap-5 text-sm font-semibold text-[#65676B]">
            <a href="#how-it-works" className="hover:text-[#1877F2]">How it works</a>
            <a href="#riders" className="hover:text-[#1877F2]">Riders</a>
            <a href="#drivers" className="hover:text-[#1877F2]">Drivers</a>
            <a href="#safety" className="hover:text-[#1877F2]">Safety</a>
          </div>

          <p className="text-xs text-[#8A8D91]">© 2026 Vaya</p>
        </div>
      </footer>
    </>
  );
}
