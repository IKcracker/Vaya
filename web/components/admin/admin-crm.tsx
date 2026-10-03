"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  ChevronRight,
  CircleCheck,
  CreditCard,
  Download,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ModuleKey =
  | "overview"
  | "drivers"
  | "trips"
  | "bookings"
  | "passengers"
  | "payments"
  | "safety";

const modules: Array<{
  key: ModuleKey;
  label: string;
  icon: typeof LayoutDashboard;
  count?: number;
}> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "drivers", label: "Driver verification", icon: BadgeCheck, count: 12 },
  { key: "trips", label: "Trips", icon: Route },
  { key: "bookings", label: "Bookings", icon: WalletCards },
  { key: "passengers", label: "Passengers", icon: Users },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "safety", label: "Safety & disputes", icon: ShieldAlert, count: 3 },
];

const stats = [
  {
    label: "Pending driver reviews",
    value: "12",
    note: "5 ready for approval",
    change: "Needs action",
    tone: "warning" as const,
    icon: UserCheck,
  },
  {
    label: "Trips today",
    value: "43",
    note: "Across 7 provinces",
    change: "38 on schedule",
    tone: "success" as const,
    icon: Route,
  },
  {
    label: "Booked seats",
    value: "118",
    note: "76% average occupancy",
    change: "+14 today",
    tone: "default" as const,
    icon: Users,
  },
  {
    label: "Open safety cases",
    value: "3",
    note: "1 high priority",
    change: "Review now",
    tone: "destructive" as const,
    icon: ShieldAlert,
  },
];

const drivers = [
  {
    id: "preview-driver-1",
    initials: "TM",
    name: "Thabo Mokoena",
    location: "Polokwane, Limpopo",
    vehicle: "Toyota Corolla · 2022",
    checks: "Licence + vehicle",
    submitted: "18 min ago",
    status: "Review",
  },
  {
    id: "preview-driver-2",
    initials: "LN",
    name: "Lerato Ndlovu",
    location: "Midrand, Gauteng",
    vehicle: "VW Polo · 2021",
    checks: "Vehicle disc missing",
    submitted: "42 min ago",
    status: "Needs info",
  },
  {
    id: "preview-driver-3",
    initials: "RM",
    name: "Rendani Mulaudzi",
    location: "Thohoyandou, Limpopo",
    vehicle: "Ford Everest · 2023",
    checks: "All checks complete",
    submitted: "1 hr ago",
    status: "Ready",
  },
  {
    id: "preview-driver-4",
    initials: "SK",
    name: "Sibusiso Khumalo",
    location: "Durban, KwaZulu-Natal",
    vehicle: "Toyota Quest · 2020",
    checks: "Identity review",
    submitted: "2 hrs ago",
    status: "Review",
  },
];

const trips = [
  {
    id: "VY-1048",
    route: "Johannesburg → Durban",
    driver: "Lebo Mokoena",
    departure: "06:30",
    date: "09 Oct",
    occupancy: "3 / 4",
    fare: "R280",
    status: "On schedule",
  },
  {
    id: "VY-1051",
    route: "Cape Town → Gqeberha",
    driver: "Anele Dlamini",
    departure: "07:00",
    date: "09 Oct",
    occupancy: "4 / 4",
    fare: "R320",
    status: "Full",
  },
  {
    id: "VY-1053",
    route: "Polokwane → Pretoria",
    driver: "Rendani Mulaudzi",
    departure: "08:30",
    date: "09 Oct",
    occupancy: "2 / 4",
    fare: "R180",
    status: "On schedule",
  },
  {
    id: "VY-1055",
    route: "Mbombela → Pretoria",
    driver: "Karabo Maseko",
    departure: "09:15",
    date: "09 Oct",
    occupancy: "1 / 3",
    fare: "R190",
    status: "Boarding",
  },
];

const bookings = [
  {
    id: "BK-20491",
    passenger: "Thato Maseko",
    trip: "Johannesburg → Durban",
    seat: "1 seat",
    amount: "R280",
    payment: "Paid",
    status: "Confirmed",
  },
  {
    id: "BK-20492",
    passenger: "Nokuthula Dube",
    trip: "Cape Town → Gqeberha",
    seat: "2 seats",
    amount: "R640",
    payment: "Paid",
    status: "Confirmed",
  },
  {
    id: "BK-20493",
    passenger: "Kagiso Seabi",
    trip: "Polokwane → Pretoria",
    seat: "1 seat",
    amount: "R180",
    payment: "Pending",
    status: "Awaiting payment",
  },
  {
    id: "BK-20494",
    passenger: "Mpho Baloyi",
    trip: "Mbombela → Pretoria",
    seat: "1 seat",
    amount: "R190",
    payment: "Paid",
    status: "Confirmed",
  },
];

const passengers = [
  {
    id: "preview-passenger-1",
    name: "Thato Maseko",
    contact: "thato.maseko@example.com",
    city: "Johannesburg",
    trips: "11",
    joined: "Aug 2026",
    status: "Active",
  },
  {
    id: "preview-passenger-2",
    name: "Nokuthula Dube",
    contact: "nokuthula@example.com",
    city: "Cape Town",
    trips: "7",
    joined: "Sep 2026",
    status: "Active",
  },
  {
    id: "preview-passenger-3",
    name: "Kagiso Seabi",
    contact: "kagiso@example.com",
    city: "Polokwane",
    trips: "4",
    joined: "Sep 2026",
    status: "Active",
  },
  {
    id: "preview-passenger-4",
    name: "Mpho Baloyi",
    contact: "mpho@example.com",
    city: "Mbombela",
    trips: "2",
    joined: "Oct 2026",
    status: "Review",
  },
];

const payments = [
  {
    ref: "PAY-88431",
    booking: "BK-20491",
    customer: "Thato Maseko",
    amount: "R280.00",
    method: "Card",
    date: "09 Oct · 05:48",
    status: "Settled",
  },
  {
    ref: "PAY-88432",
    booking: "BK-20492",
    customer: "Nokuthula Dube",
    amount: "R640.00",
    method: "Instant EFT",
    date: "09 Oct · 06:02",
    status: "Settled",
  },
  {
    ref: "PAY-88433",
    booking: "BK-20493",
    customer: "Kagiso Seabi",
    amount: "R180.00",
    method: "Card",
    date: "09 Oct · 06:21",
    status: "Pending",
  },
  {
    ref: "PAY-88434",
    booking: "BK-20494",
    customer: "Mpho Baloyi",
    amount: "R190.00",
    method: "Card",
    date: "09 Oct · 06:35",
    status: "Settled",
  },
];

const initialActivity = [
  { id: "A-1", title: "Driver application submitted", detail: "Sibusiso Khumalo · Durban", time: "2 hrs ago" },
  { id: "A-2", title: "Payment settled", detail: "PAY-88432 · R640.00", time: "3 hrs ago" },
  { id: "A-3", title: "Safety case opened", detail: "SAFE-031 · High priority", time: "4 hrs ago" },
];

const safetyCases = [
  {
    id: "SAFE-031",
    databaseId: "preview-safety-1",
    subject: "Passenger reported unsafe driving",
    trip: "VY-1041 · Pretoria → Polokwane",
    priority: "High",
    owner: "Unassigned",
    created: "22 min ago",
    status: "Open",
  },
  {
    id: "SAFE-030",
    databaseId: "preview-safety-2",
    subject: "Dispute about pickup location",
    trip: "VY-1039 · Johannesburg → Durban",
    priority: "Medium",
    owner: "P. Molefe",
    created: "1 hr ago",
    status: "Investigating",
  },
  {
    id: "SAFE-029",
    subject: "Refund requested after cancellation",
    trip: "VY-1036 · Cape Town → Worcester",
    priority: "Low",
    owner: "T. Jacobs",
    created: "3 hrs ago",
    status: "Waiting",
  },
];

function statusVariant(value: string) {
  const lower = value.toLowerCase();
  if (
    lower.includes("ready") ||
    lower.includes("active") ||
    lower.includes("confirmed") ||
    lower.includes("settled") ||
    lower.includes("schedule") ||
    lower.includes("approved")
  ) {
    return "success" as const;
  }
  if (
    lower.includes("pending") ||
    lower.includes("waiting") ||
    lower.includes("boarding") ||
    lower.includes("review")
  ) {
    return "warning" as const;
  }
  if (lower.includes("high") || lower.includes("open") || lower.includes("needs") || lower.includes("reject")) {
    return "destructive" as const;
  }
  return "secondary" as const;
}

function TableActions({ onClick, label = "View record" }: { onClick: () => void; label?: string }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
      <MoreHorizontal />
    </Button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
      <Search className="size-6 text-[#98A2B3]" />
      <p className="mt-3 text-sm font-semibold text-[#344054]">No {label} found</p>
      <p className="mt-1 text-xs text-[#98A2B3]">Try another search term or clear your filters.</p>
    </div>
  );
}

export function AdminCrm() {
  const [active, setActive] = useState<ModuleKey>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [driverRecords, setDriverRecords] = useState(drivers);
  const [tripRecords, setTripRecords] = useState(trips);
  const [passengerRecords, setPassengerRecords] = useState(passengers);
  const [bookingRecords, setBookingRecords] = useState(bookings);
  const [paymentRecords, setPaymentRecords] = useState(payments);
  const [safetyRecords, setSafetyRecords] = useState(safetyCases);
  const [backendMode, setBackendMode] = useState<"loading" | "live" | "preview">("loading");
  const [backendError, setBackendError] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<(typeof drivers)[number] | null>(null);
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [createTripOpen, setCreateTripOpen] = useState(false);
  const [addPassengerOpen, setAddPassengerOpen] = useState(false);
  const [createSafetyOpen, setCreateSafetyOpen] = useState(false);
  const [recordDetail, setRecordDetail] = useState<{
    title: string;
    subtitle?: string;
    fields: Array<[string, string]>;
  } | null>(null);
  const [activityLog, setActivityLog] = useState(initialActivity);

  const current = modules.find((item) => item.key === active) ?? modules[0];

  const normalizedQuery = query.trim().toLowerCase();

  const filteredDrivers = useMemo(
    () =>
      driverRecords.filter((driver) =>
        [driver.name, driver.location, driver.vehicle, driver.status]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      ),
    [normalizedQuery, driverRecords]
  );

  const filteredTrips = useMemo(
    () =>
      tripRecords.filter((trip) =>
        [trip.id, trip.route, trip.driver, trip.status]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      ),
    [normalizedQuery, tripRecords]
  );

  const filteredBookings = useMemo(
    () =>
      bookingRecords.filter((booking) =>
        [booking.id, booking.passenger, booking.trip, booking.status]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      ),
    [normalizedQuery, bookingRecords]
  );

  const filteredPassengers = useMemo(
    () =>
      passengerRecords.filter((passenger) =>
        [passenger.name, passenger.contact, passenger.city, passenger.status]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      ),
    [normalizedQuery, passengerRecords]
  );

  const filteredPayments = useMemo(
    () =>
      paymentRecords.filter((payment) =>
        [payment.ref, payment.booking, payment.customer, payment.status]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      ),
    [normalizedQuery, paymentRecords]
  );

  const filteredSafety = useMemo(
    () =>
      safetyRecords.filter((item) =>
        [item.id, item.subject, item.trip, item.priority, item.status]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      ),
    [normalizedQuery, safetyRecords]
  );

  const setModule = (key: ModuleKey) => {
    setActive(key);
    setMobileOpen(false);
    setQuery("");
  };


  const refreshDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || payload?.configured === false) {
        setBackendMode("preview");
        setBackendError(
          payload?.error ??
            "Neon is not configured for this deployment. Using preview data."
        );
        return;
      }

      setDriverRecords(payload.drivers);
      setTripRecords(payload.trips);
      setBookingRecords(payload.bookings);
      setPassengerRecords(payload.passengers);
      setPaymentRecords(payload.payments);
      setSafetyRecords(payload.safetyCases);
      setActivityLog(payload.activity);
      setBackendMode("live");
      setBackendError(null);
    } catch {
      setBackendMode("preview");
      setBackendError("Unable to reach the backend. Using preview data.");
    }
  }, []);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const addActivity = (title: string, detail: string) => {
    setActivityLog((items) => [
      { id: `A-${Date.now()}`, title, detail, time: "Just now" },
      ...items,
    ].slice(0, 6));
  };

  const openDriverReview = (driver: (typeof drivers)[number]) => {
    setSelectedDriver(driver);
    setDriverDialogOpen(true);
  };

  const updateDriverStatus = async (status: string) => {
    if (!selectedDriver) return;

    if (backendMode === "live") {
      const response = await fetch(`/api/admin/drivers/${selectedDriver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setBackendError(payload?.error ?? "Unable to update driver");
        return;
      }

      setDriverDialogOpen(false);
      await refreshDashboard();
      return;
    }

    setDriverRecords((rows) =>
      rows.map((driver) =>
        driver.id === selectedDriver.id ? { ...driver, status } : driver
      )
    );
    addActivity(`Driver ${status.toLowerCase()}`, selectedDriver.name);
    setDriverDialogOpen(false);
  };

  const createTrip = async (formData: FormData) => {
    const from = String(formData.get("from") || "").trim();
    const to = String(formData.get("to") || "").trim();
    const driver = String(formData.get("driver") || "").trim();
    const date = String(formData.get("date") || "").trim();
    const departure = String(formData.get("departure") || "").trim();
    const seats = String(formData.get("seats") || "4").trim();
    const fare = String(formData.get("fare") || "").trim();

    if (!from || !to || !driver || !date || !departure || !fare) return;

    if (backendMode === "live") {
      const response = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to,
          driver,
          date,
          departure,
          seats: Number(seats),
          fare: Number(fare.replace(/^R/i, "")),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setBackendError(payload?.error ?? "Unable to create trip");
        return;
      }

      setCreateTripOpen(false);
      await refreshDashboard();
      return;
    }

    const trip = {
      id: `VY-${1100 + tripRecords.length + 1}`,
      route: `${from} → ${to}`,
      driver,
      departure,
      date,
      occupancy: `0 / ${seats}`,
      fare: fare.startsWith("R") ? fare : `R${fare}`,
      status: "Scheduled",
    };

    setTripRecords((rows) => [trip, ...rows]);
    addActivity("Trip created", `${trip.id} · ${trip.route}`);
    setCreateTripOpen(false);
  };

  const addPassenger = async (formData: FormData) => {
    const name = String(formData.get("name") || "").trim();
    const contact = String(formData.get("contact") || "").trim();
    const city = String(formData.get("city") || "").trim();

    if (!name || !contact || !city) return;

    if (backendMode === "live") {
      const response = await fetch("/api/admin/passengers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: contact, city }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setBackendError(payload?.error ?? "Unable to add passenger");
        return;
      }

      setAddPassengerOpen(false);
      await refreshDashboard();
      return;
    }

    setPassengerRecords((rows) => [
      {
        id: `preview-passenger-${Date.now()}`,
        name,
        contact,
        city,
        trips: "0",
        joined: "Oct 2026",
        status: "Active",
      },
      ...rows,
    ]);
    addActivity("Passenger added", `${name} · ${city}`);
    setAddPassengerOpen(false);
  };

  const createSafetyCase = async (formData: FormData) => {
    const subject = String(formData.get("subject") || "").trim();
    const trip = String(formData.get("trip") || "").trim();
    const priority = String(formData.get("priority") || "Medium").trim();
    const owner = String(formData.get("owner") || "Unassigned").trim();
    const note = String(formData.get("note") || "").trim();

    if (!subject || !trip) return;

    if (backendMode === "live") {
      const response = await fetch("/api/admin/safety-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, trip, priority, owner, note }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setBackendError(payload?.error ?? "Unable to create safety case");
        return;
      }

      setCreateSafetyOpen(false);
      await refreshDashboard();
      return;
    }

    const item = {
      id: `SAFE-${String(40 + safetyRecords.length).padStart(3, "0")}`,
      databaseId: `preview-safety-${Date.now()}`,
      subject,
      trip,
      priority,
      owner,
      created: "Just now",
      status: "Open",
    };

    setSafetyRecords((rows) => [item, ...rows]);
    addActivity("Safety case created", `${item.id} · ${priority} priority`);
    setCreateSafetyOpen(false);
  };

  const openDetails = (title: string, subtitle: string | undefined, fields: Array<[string, string]>) => {
    setRecordDetail({ title, subtitle, fields });
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#101828] lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[#101828]/30 backdrop-blur-[1px] lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#E4E7EC] bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-[#EAECF0] px-5">
          <Link href="/" className="inline-flex items-baseline" aria-label="Vaya home">
            <span className="text-[22px] font-extrabold tracking-[-1.1px]">vaya</span>
            <span className="ml-0.5 text-[22px] font-black text-[#1877F2]">.</span>
            <span className="ml-2 rounded-md bg-[#F2F4F7] px-2 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#667085]">
              Admin
            </span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X />
          </Button>
        </div>

        <div className="px-3 py-4">
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#98A2B3]">
            Workspace
          </div>
          <nav className="space-y-1" aria-label="Admin modules">
            {modules.map((item) => {
              const Icon = item.icon;
              const selected = active === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setModule(item.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition ${selected ? "bg-[#E7F3FF] text-[#1877F2]" : "text-[#475467] hover:bg-[#F5F7FA] hover:text-[#101828]"}`}>
                  <Icon className="size-4" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.count ? (
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${selected ? "bg-white text-[#1877F2]" : "bg-[#F2F4F7] text-[#667085]"}`}>
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <Separator className="mx-5 w-auto" />

        <div className="mt-auto p-4">
          <Card className="border-[#D1E9FF] bg-[#F5F9FF] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#344054]">
                <span className={`h-2 w-2 rounded-full ${backendMode === "live" ? "bg-[#12B76A]" : backendMode === "loading" ? "bg-[#F79009]" : "bg-[#98A2B3]"}`} />
                {backendMode === "live" ? "Neon database live" : backendMode === "loading" ? "Connecting to backend" : "Preview mode"}
              </div>
              <p className="mt-2 text-[11px] leading-5 text-[#667085]">
                {backendMode === "live"
                  ? "CRM changes are persisted to Neon Postgres."
                  : backendError ?? "Preview records reset when the page reloads."}
              </p>
            </CardContent>
          </Card>

          <div className="mt-4 flex items-center gap-3 rounded-lg p-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#101828] text-[11px] font-bold text-white">
              VA
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-[#101828]">Vaya Administrator</div>
              <div className="truncate text-[10px] text-[#98A2B3]">Operations team</div>
            </div>
            <MoreHorizontal className="size-4 text-[#98A2B3]" />
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#E4E7EC] bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation">
              <Menu />
            </Button>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-semibold uppercase tracking-[.1em] text-[#98A2B3]">Vaya CRM</div>
              <div className="truncate text-sm font-semibold text-[#101828]">{current.label}</div>
            </div>

            <div className="hidden w-full max-w-[360px] md:block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98A2B3]" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={active === "overview" ? "Search CRM..." : `Search ${current.label.toLowerCase()}...`}
                  className="pl-9"
                />
              </div>
            </div>

            <Button variant="outline" size="icon" aria-label="Refresh" onClick={() => void refreshDashboard()} disabled={backendMode === "loading"}>
              <RefreshCw className={backendMode === "loading" ? "animate-spin" : ""} />
            </Button>
            <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
              <Bell />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[#F04438]" />
            </Button>
          </div>

          <div className="border-t border-[#F2F4F7] px-4 py-3 md:hidden sm:px-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98A2B3]" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search current module..." className="pl-9" />
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {active === "overview" ? (
            <Overview driverRows={driverRecords} tripRows={tripRecords} safetyRows={safetyRecords} activityLog={activityLog} onOpenDrivers={() => setModule("drivers")} onOpenSafety={() => setModule("safety")} onReviewDriver={openDriverReview} onViewTrip={(trip) => openDetails(trip.id, trip.route, [["Driver", trip.driver], ["Departure", `${trip.date} · ${trip.departure}`], ["Occupancy", trip.occupancy], ["Fare", trip.fare], ["Status", trip.status]])} />
          ) : null}
          {active === "drivers" ? <DriversView rows={filteredDrivers} onReview={openDriverReview} /> : null}
          {active === "trips" ? <TripsView rows={filteredTrips} onCreate={() => setCreateTripOpen(true)} onView={(trip) => openDetails(trip.id, trip.route, [["Driver", trip.driver], ["Departure", `${trip.date} · ${trip.departure}`], ["Occupancy", trip.occupancy], ["Fare", trip.fare], ["Status", trip.status]])} /> : null}
          {active === "bookings" ? <BookingsView rows={filteredBookings} onView={(booking) => openDetails(booking.id, booking.passenger, [["Trip", booking.trip], ["Seats", booking.seat], ["Amount", booking.amount], ["Payment", booking.payment], ["Status", booking.status]])} /> : null}
          {active === "passengers" ? <PassengersView rows={filteredPassengers} onAdd={() => setAddPassengerOpen(true)} onView={(passenger) => openDetails(passenger.name, passenger.contact, [["Home city", passenger.city], ["Trips", passenger.trips], ["Joined", passenger.joined], ["Status", passenger.status]])} /> : null}
          {active === "payments" ? <PaymentsView rows={filteredPayments} onView={(payment) => openDetails(payment.ref, payment.customer, [["Booking", payment.booking], ["Amount", payment.amount], ["Method", payment.method], ["Date", payment.date], ["Status", payment.status]])} /> : null}
          {active === "safety" ? <SafetyView rows={filteredSafety} onCreate={() => setCreateSafetyOpen(true)} onView={(item) => openDetails(item.id, item.subject, [["Trip", item.trip], ["Priority", item.priority], ["Owner", item.owner], ["Created", item.created], ["Status", item.status]])} /> : null}
        </div>
      </main>

      <DriverReviewDialog
        open={driverDialogOpen}
        driver={selectedDriver}
        onOpenChange={setDriverDialogOpen}
        onUpdateStatus={updateDriverStatus}
      />
      <CreateTripDialog open={createTripOpen} onOpenChange={setCreateTripOpen} onSubmit={createTrip} />
      <AddPassengerDialog open={addPassengerOpen} onOpenChange={setAddPassengerOpen} onSubmit={addPassenger} />
      <CreateSafetyDialog open={createSafetyOpen} onOpenChange={setCreateSafetyOpen} onSubmit={createSafetyCase} />
      <RecordDetailsDialog detail={recordDetail} onOpenChange={(open) => !open && setRecordDetail(null)} />
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#1877F2]">{eyebrow}</div>
        <h1 className="mt-2 text-2xl font-bold tracking-[-.035em] text-[#101828] sm:text-[28px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Overview({
  driverRows,
  tripRows,
  safetyRows,
  activityLog,
  onOpenDrivers,
  onOpenSafety,
  onReviewDriver,
  onViewTrip,
}: {
  driverRows: typeof drivers;
  tripRows: typeof trips;
  safetyRows: typeof safetyCases;
  activityLog: Array<{ id: string; title: string; detail: string; time: string }>;
  onOpenDrivers: () => void;
  onOpenSafety: () => void;
  onReviewDriver: (driver: (typeof drivers)[number]) => void;
  onViewTrip: (trip: (typeof trips)[number]) => void;
}) {
  const overviewStats = [
    { ...stats[0], value: String(driverRows.filter((driver) => driver.status !== "Approved").length), note: `${driverRows.filter((driver) => driver.status === "Ready").length} ready for approval` },
    { ...stats[1], value: String(tripRows.length), note: "Current trip records" },
    stats[2],
    { ...stats[3], value: String(safetyRows.filter((item) => item.status !== "Closed").length), note: `${safetyRows.filter((item) => item.priority === "High").length} high priority` },
  ];

  return (
    <>
      <PageHeading
        eyebrow="Operations overview"
        title="Today’s network"
        description="Monitor driver readiness, active trips, bookings and safety issues from one operational view."
        action={
          <Button onClick={onOpenDrivers} className="h-9 bg-[#1877F2] px-4 hover:bg-[#166FE5]">
            Review drivers
            <ChevronRight />
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#F2F4F7] text-[#475467]">
                    <Icon className="size-4" />
                  </div>
                  <Badge variant={stat.tone}>{stat.change}</Badge>
                </div>
                <div className="mt-5 text-[11px] font-semibold text-[#667085]">{stat.label}</div>
                <div className="mt-1 text-3xl font-bold tracking-[-.04em] text-[#101828]">{stat.value}</div>
                <div className="mt-2 text-[11px] text-[#98A2B3]">{stat.note}</div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
        <Card className="overflow-hidden shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b border-[#EAECF0]">
            <div>
              <CardTitle>Driver verification queue</CardTitle>
              <CardDescription>Applications requiring operational review.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onOpenDrivers}>View all</Button>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Driver</TableHead>
                <TableHead>Checks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverRows.slice(0, 3).map((driver) => (
                <TableRow key={driver.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#E7F3FF] text-[10px] font-bold text-[#1877F2]">{driver.initials}</div>
                      <div>
                        <div className="font-semibold text-[#101828]">{driver.name}</div>
                        <div className="mt-0.5 text-[11px] text-[#98A2B3]">{driver.vehicle}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{driver.checks}</TableCell>
                  <TableCell><Badge variant={statusVariant(driver.status)}>{driver.status}</Badge></TableCell>
                  <TableCell className="text-right"><TableActions onClick={() => onReviewDriver(driver)} label={`Review ${driver.name}`} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="border-b border-[#EAECF0]">
            <CardTitle>Operations attention</CardTitle>
            <CardDescription>Items that should be handled first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <button type="button" onClick={onOpenSafety} className="flex w-full items-start gap-3 rounded-lg border border-[#FECACA] bg-[#FFF8F7] p-4 text-left transition hover:bg-[#FFF3F1]">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FEE4E2] text-[#D92D20]">
                <AlertTriangle className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#101828]">1 high-priority safety case</div>
                <div className="mt-1 text-[11px] leading-5 text-[#667085]">Unsafe driving report waiting for assignment.</div>
              </div>
              <ChevronRight className="mt-1 size-4 text-[#98A2B3]" />
            </button>

            <button type="button" onClick={onOpenDrivers} className="flex w-full items-start gap-3 rounded-lg border border-[#FEDF89] bg-[#FFFCF5] p-4 text-left transition hover:bg-[#FFFAEB]">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FEF0C7] text-[#B54708]">
                <UserCheck className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#101828]">5 drivers ready to approve</div>
                <div className="mt-1 text-[11px] leading-5 text-[#667085]">All required checks are complete.</div>
              </div>
              <ChevronRight className="mt-1 size-4 text-[#98A2B3]" />
            </button>

            <div className="flex items-start gap-3 rounded-lg border border-[#D1E9FF] bg-[#F5F9FF] p-4">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#E7F3FF] text-[#1877F2]">
                <CircleCheck className="size-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#101828]">38 trips on schedule</div>
                <div className="mt-1 text-[11px] leading-5 text-[#667085]">No network-level trip disruption detected.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden shadow-none">
        <CardHeader className="flex-row items-start justify-between gap-4 border-b border-[#EAECF0]">
          <div>
            <CardTitle>Active trip board</CardTitle>
            <CardDescription>Current and upcoming departures across the network.</CardDescription>
          </div>
          <Badge variant="success">Live</Badge>
        </CardHeader>
        <TripsTable rows={tripRows} onView={onViewTrip} />
      </Card>

      <Card className="mt-6 shadow-none">
        <CardHeader className="border-b border-[#EAECF0]">
          <CardTitle>Recent CRM activity</CardTitle>
          <CardDescription>Actions completed in this admin session.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-[#EAECF0] p-0">
          {activityLog.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-5 py-4">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1877F2]" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#101828]">{item.title}</div>
                <div className="mt-1 text-[11px] text-[#667085]">{item.detail}</div>
              </div>
              <div className="shrink-0 text-[10px] text-[#98A2B3]">{item.time}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function DriversView({ rows, onReview }: { rows: typeof drivers; onReview: (driver: (typeof drivers)[number]) => void }) {
  return (
    <>
      <PageHeading
        eyebrow="Driver operations"
        title="Driver verification"
        description="Review identity, licence and vehicle documentation before drivers can publish trips."
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="h-9"><Download /> Export</Button>
            <Button className="h-9 bg-[#1877F2] hover:bg-[#166FE5]" disabled={!rows.length} onClick={() => rows[0] && onReview(rows[0])}><UserCheck /> Review next</Button>
          </div>
        }
      />
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="flex-row items-center justify-between border-b border-[#EAECF0]">
          <div>
            <CardTitle>Verification queue</CardTitle>
            <CardDescription>{rows.length} driver applications shown</CardDescription>
          </div>
          <Button variant="outline" size="sm"><SlidersHorizontal /> Filters</Button>
        </CardHeader>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Checks</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((driver) => (
                <TableRow key={driver.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#E7F3FF] text-[10px] font-bold text-[#1877F2]">{driver.initials}</div>
                      <div>
                        <div className="font-semibold text-[#101828]">{driver.name}</div>
                        <div className="mt-0.5 text-[11px] text-[#98A2B3]">{driver.location}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{driver.vehicle}</TableCell>
                  <TableCell>{driver.checks}</TableCell>
                  <TableCell>{driver.submitted}</TableCell>
                  <TableCell><Badge variant={statusVariant(driver.status)}>{driver.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onReview(driver)}>Review</Button>
                      <TableActions onClick={() => onReview(driver)} label={`Review ${driver.name}`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <EmptyState label="drivers" />}
      </Card>
    </>
  );
}

function TripsView({ rows, onCreate, onView }: { rows: typeof trips; onCreate: () => void; onView: (trip: (typeof trips)[number]) => void }) {
  return (
    <>
      <PageHeading
        eyebrow="Network operations"
        title="Trips"
        description="Manage scheduled journeys, occupancy, departure readiness and route status."
        action={<Button className="h-9 bg-[#1877F2] hover:bg-[#166FE5]" onClick={onCreate}><Plus /> Create trip</Button>}
      />
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="flex-row items-center justify-between border-b border-[#EAECF0]">
          <div>
            <CardTitle>Trip board</CardTitle>
            <CardDescription>{rows.length} trips shown</CardDescription>
          </div>
          <Button variant="outline" size="sm"><SlidersHorizontal /> Filters</Button>
        </CardHeader>
        {rows.length ? <TripsTable rows={rows} onView={onView} /> : <EmptyState label="trips" />}
      </Card>
    </>
  );
}

function TripsTable({ rows, onView }: { rows: typeof trips; onView: (trip: (typeof trips)[number]) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Trip</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead>Departure</TableHead>
          <TableHead>Occupancy</TableHead>
          <TableHead>Fare</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((trip) => (
          <TableRow key={trip.id}>
            <TableCell>
              <div className="font-semibold text-[#101828]">{trip.route}</div>
              <div className="mt-0.5 text-[11px] text-[#98A2B3]">{trip.id}</div>
            </TableCell>
            <TableCell>{trip.driver}</TableCell>
            <TableCell>{trip.date} · {trip.departure}</TableCell>
            <TableCell>{trip.occupancy}</TableCell>
            <TableCell className="font-semibold text-[#101828]">{trip.fare}</TableCell>
            <TableCell><Badge variant={statusVariant(trip.status)}>{trip.status}</Badge></TableCell>
            <TableCell className="text-right"><TableActions onClick={() => onView(trip)} label={`View ${trip.id}`} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function BookingsView({ rows, onView }: { rows: typeof bookings; onView: (booking: (typeof bookings)[number]) => void }) {
  return (
    <>
      <PageHeading
        eyebrow="Customer operations"
        title="Bookings"
        description="Track seat reservations, passenger payment state and booking fulfilment."
        action={<Button variant="outline" className="h-9"><Download /> Export bookings</Button>}
      />
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="border-b border-[#EAECF0]">
          <CardTitle>Booking ledger</CardTitle>
          <CardDescription>{rows.length} bookings shown</CardDescription>
        </CardHeader>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Booking</TableHead>
                <TableHead>Passenger</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-semibold text-[#101828]">{booking.id}</TableCell>
                  <TableCell>{booking.passenger}</TableCell>
                  <TableCell>{booking.trip}</TableCell>
                  <TableCell>{booking.seat}</TableCell>
                  <TableCell className="font-semibold text-[#101828]">{booking.amount}</TableCell>
                  <TableCell><Badge variant={statusVariant(booking.payment)}>{booking.payment}</Badge></TableCell>
                  <TableCell><Badge variant={statusVariant(booking.status)}>{booking.status}</Badge></TableCell>
                  <TableCell className="text-right"><TableActions onClick={() => onView(booking)} label={`View ${booking.id}`} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <EmptyState label="bookings" />}
      </Card>
    </>
  );
}

function PassengersView({ rows, onAdd, onView }: { rows: typeof passengers; onAdd: () => void; onView: (passenger: (typeof passengers)[number]) => void }) {
  return (
    <>
      <PageHeading
        eyebrow="Customer records"
        title="Passengers"
        description="View passenger accounts, travel activity and account status."
        action={<Button className="h-9 bg-[#1877F2] hover:bg-[#166FE5]" onClick={onAdd}><Plus /> Add passenger</Button>}
      />
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="border-b border-[#EAECF0]">
          <CardTitle>Passenger directory</CardTitle>
          <CardDescription>{rows.length} passenger records shown</CardDescription>
        </CardHeader>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Passenger</TableHead>
                <TableHead>Home city</TableHead>
                <TableHead>Trips</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((passenger) => (
                <TableRow key={passenger.contact}>
                  <TableCell>
                    <div className="font-semibold text-[#101828]">{passenger.name}</div>
                    <div className="mt-0.5 text-[11px] text-[#98A2B3]">{passenger.contact}</div>
                  </TableCell>
                  <TableCell>{passenger.city}</TableCell>
                  <TableCell>{passenger.trips}</TableCell>
                  <TableCell>{passenger.joined}</TableCell>
                  <TableCell><Badge variant={statusVariant(passenger.status)}>{passenger.status}</Badge></TableCell>
                  <TableCell className="text-right"><TableActions onClick={() => onView(passenger)} label={`View ${passenger.name}`} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <EmptyState label="passengers" />}
      </Card>
    </>
  );
}

function PaymentsView({ rows, onView }: { rows: typeof payments; onView: (payment: (typeof payments)[number]) => void }) {
  return (
    <>
      <PageHeading
        eyebrow="Finance operations"
        title="Payments"
        description="Monitor booking collections, settlement status and payment references."
        action={<Button variant="outline" className="h-9"><Download /> Export payments</Button>}
      />
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="shadow-none"><CardContent className="p-5"><div className="text-[11px] font-semibold text-[#667085]">Collected today</div><div className="mt-2 text-2xl font-bold tracking-[-.03em]">R24,860</div><Badge variant="success" className="mt-3">Settled</Badge></CardContent></Card>
        <Card className="shadow-none"><CardContent className="p-5"><div className="text-[11px] font-semibold text-[#667085]">Pending</div><div className="mt-2 text-2xl font-bold tracking-[-.03em]">R1,460</div><Badge variant="warning" className="mt-3">6 payments</Badge></CardContent></Card>
        <Card className="shadow-none"><CardContent className="p-5"><div className="text-[11px] font-semibold text-[#667085]">Refund requests</div><div className="mt-2 text-2xl font-bold tracking-[-.03em]">R640</div><Badge variant="secondary" className="mt-3">2 requests</Badge></CardContent></Card>
      </section>
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="border-b border-[#EAECF0]">
          <CardTitle>Payment ledger</CardTitle>
          <CardDescription>{rows.length} payments shown</CardDescription>
        </CardHeader>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Reference</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((payment) => (
                <TableRow key={payment.ref}>
                  <TableCell className="font-semibold text-[#101828]">{payment.ref}</TableCell>
                  <TableCell>{payment.booking}</TableCell>
                  <TableCell>{payment.customer}</TableCell>
                  <TableCell className="font-semibold text-[#101828]">{payment.amount}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell><Badge variant={statusVariant(payment.status)}>{payment.status}</Badge></TableCell>
                  <TableCell className="text-right"><TableActions onClick={() => onView(payment)} label={`View ${payment.ref}`} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <EmptyState label="payments" />}
      </Card>
    </>
  );
}

function SafetyView({ rows, onCreate, onView }: { rows: typeof safetyCases; onCreate: () => void; onView: (item: (typeof safetyCases)[number]) => void }) {
  return (
    <>
      <PageHeading
        eyebrow="Trust & safety"
        title="Safety & disputes"
        description="Investigate safety reports, booking disputes and refund-related incidents."
        action={<Button className="h-9 bg-[#1877F2] hover:bg-[#166FE5]" onClick={onCreate}><Plus /> Create case</Button>}
      />
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="flex-row items-center justify-between border-b border-[#EAECF0]">
          <div>
            <CardTitle>Case queue</CardTitle>
            <CardDescription>{rows.length} cases shown</CardDescription>
          </div>
          <Button variant="outline" size="sm"><SlidersHorizontal /> Filters</Button>
        </CardHeader>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Case</TableHead>
                <TableHead>Related trip</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-semibold text-[#101828]">{item.subject}</div>
                    <div className="mt-0.5 text-[11px] text-[#98A2B3]">{item.id}</div>
                  </TableCell>
                  <TableCell>{item.trip}</TableCell>
                  <TableCell><Badge variant={statusVariant(item.priority)}>{item.priority}</Badge></TableCell>
                  <TableCell>{item.owner}</TableCell>
                  <TableCell>{item.created}</TableCell>
                  <TableCell><Badge variant={statusVariant(item.status)}>{item.status}</Badge></TableCell>
                  <TableCell className="text-right"><TableActions onClick={() => onView(item)} label={`View ${item.id}`} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <EmptyState label="cases" />}
      </Card>
    </>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function DriverReviewDialog({
  open,
  driver,
  onOpenChange,
  onUpdateStatus,
}: {
  open: boolean;
  driver: (typeof drivers)[number] | null;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (status: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Driver verification review</DialogTitle>
          <DialogDescription>
            Review the submitted profile and decide whether this driver can publish trips.
          </DialogDescription>
        </DialogHeader>

        {driver ? (
          <div className="space-y-5 p-5">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#E7F3FF] text-sm font-bold text-[#1877F2]">
                {driver.initials}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[#101828]">{driver.name}</div>
                <div className="mt-1 text-xs text-[#667085]">{driver.location}</div>
              </div>
              <Badge variant={statusVariant(driver.status)} className="ml-auto">{driver.status}</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Vehicle", driver.vehicle],
                ["Verification checks", driver.checks],
                ["Submitted", driver.submitted],
                ["Current decision", driver.status],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#98A2B3]">{label}</div>
                  <div className="mt-2 text-sm font-semibold text-[#344054]">{value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[#D1E9FF] bg-[#F5F9FF] p-4">
              <div className="text-xs font-semibold text-[#101828]">Verification checklist</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {["Identity", "Driver licence", "Vehicle details"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-[#475467]">
                    <CircleCheck className="size-4 text-[#12B76A]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={() => onUpdateStatus("Rejected")}>Reject</Button>
          <Button type="button" variant="outline" onClick={() => onUpdateStatus("Needs info")}>Request info</Button>
          <Button type="button" className="bg-[#1877F2] hover:bg-[#166FE5]" onClick={() => onUpdateStatus("Approved")}>
            Approve driver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateTripDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create trip</DialogTitle>
          <DialogDescription>Create an operational trip record for a scheduled driver journey.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(new FormData(event.currentTarget));
          }}>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <FormField label="Starting point" htmlFor="trip-from">
              <Input id="trip-from" name="from" placeholder="Johannesburg" required />
            </FormField>
            <FormField label="Destination" htmlFor="trip-to">
              <Input id="trip-to" name="to" placeholder="Durban" required />
            </FormField>
            <FormField label="Driver" htmlFor="trip-driver">
              <Input id="trip-driver" name="driver" placeholder="Driver name" required />
            </FormField>
            <FormField label="Date" htmlFor="trip-date">
              <Input id="trip-date" name="date" type="date" required />
            </FormField>
            <FormField label="Departure time" htmlFor="trip-departure">
              <Input id="trip-departure" name="departure" type="time" required />
            </FormField>
            <FormField label="Available seats" htmlFor="trip-seats">
              <Input id="trip-seats" name="seats" type="number" min="1" max="8" defaultValue="4" required />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Fare per seat" htmlFor="trip-fare">
                <Input id="trip-fare" name="fare" inputMode="numeric" placeholder="280" required />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#1877F2] hover:bg-[#166FE5]">Create trip</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddPassengerDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add passenger</DialogTitle>
          <DialogDescription>Create a passenger CRM record for support and operational management.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(new FormData(event.currentTarget));
          }}>
          <div className="space-y-4 p-5">
            <FormField label="Full name" htmlFor="passenger-name">
              <Input id="passenger-name" name="name" placeholder="Full name" required />
            </FormField>
            <FormField label="Email" htmlFor="passenger-contact">
              <Input id="passenger-contact" name="contact" type="email" placeholder="name@example.com" required />
            </FormField>
            <FormField label="Home city" htmlFor="passenger-city">
              <Input id="passenger-city" name="city" placeholder="Johannesburg" required />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#1877F2] hover:bg-[#166FE5]">Add passenger</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateSafetyDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create safety case</DialogTitle>
          <DialogDescription>Record an incident or dispute and route it for investigation.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(new FormData(event.currentTarget));
          }}>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField label="Case subject" htmlFor="case-subject">
                <Input id="case-subject" name="subject" placeholder="Describe the issue briefly" required />
              </FormField>
            </div>
            <FormField label="Related trip" htmlFor="case-trip">
              <Input id="case-trip" name="trip" placeholder="VY-1055 · Mbombela → Pretoria" required />
            </FormField>
            <FormField label="Owner" htmlFor="case-owner">
              <Input id="case-owner" name="owner" placeholder="Unassigned" />
            </FormField>
            <FormField label="Priority" htmlFor="case-priority">
              <select
                id="case-priority"
                name="priority"
                defaultValue="Medium"
                className="h-9 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-sm text-[#101828] outline-none transition focus:border-[#84ADFF] focus:ring-3 focus:ring-[#D1E9FF]">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Internal note" htmlFor="case-note">
                <Textarea id="case-note" name="note" placeholder="Add context for the investigation team..." />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#1877F2] hover:bg-[#166FE5]">Create case</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RecordDetailsDialog({
  detail,
  onOpenChange,
}: {
  detail: { title: string; subtitle?: string; fields: Array<[string, string]> } | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(detail)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{detail?.title ?? "Record details"}</DialogTitle>
          {detail?.subtitle ? <DialogDescription>{detail.subtitle}</DialogDescription> : null}
        </DialogHeader>
        <div className="p-5">
          <div className="divide-y divide-[#EAECF0] rounded-lg border border-[#EAECF0]">
            {detail?.fields.map(([label, value]) => (
              <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[130px_1fr] sm:gap-4">
                <div className="text-[11px] font-semibold text-[#667085]">{label}</div>
                <div className="text-sm font-medium text-[#101828]">{value}</div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)} className="bg-[#1877F2] hover:bg-[#166FE5]">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

