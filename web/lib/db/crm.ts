import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDb } from "./index";
import {
  activityLogs,
  bookings,
  drivers,
  passengers,
  payments,
  safetyCases,
  trips,
} from "./schema";

const zaDate = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "short",
  timeZone: "Africa/Johannesburg",
});

const zaTime = new Intl.DateTimeFormat("en-ZA", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Africa/Johannesburg",
});

const zaMonthYear = new Intl.DateTimeFormat("en-ZA", {
  month: "short",
  year: "numeric",
  timeZone: "Africa/Johannesburg",
});

function money(cents: number) {
  return `R${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function relativeTime(date: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export async function getAdminDashboard() {
  const db = getDb();

  const [
    driverRows,
    tripRows,
    passengerRows,
    bookingRows,
    paymentRows,
    safetyRows,
    activityRows,
  ] = await Promise.all([
    db.select().from(drivers).orderBy(desc(drivers.submittedAt)),
    db.select().from(trips).orderBy(desc(trips.departureAt)),
    db.select().from(passengers).orderBy(desc(passengers.joinedAt)),
    db
      .select({
        id: bookings.publicId,
        passenger: passengers.name,
        fromCity: trips.fromCity,
        toCity: trips.toCity,
        seats: bookings.seats,
        amountCents: bookings.amountCents,
        paymentStatus: bookings.paymentStatus,
        status: bookings.status,
      })
      .from(bookings)
      .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .orderBy(desc(bookings.createdAt)),
    db
      .select({
        ref: payments.publicId,
        booking: bookings.publicId,
        customer: passengers.name,
        amountCents: payments.amountCents,
        method: payments.method,
        status: payments.status,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
      .orderBy(desc(payments.createdAt)),
    db.select().from(safetyCases).orderBy(desc(safetyCases.createdAt)),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(8),
  ]);

  return {
    configured: true,
    drivers: driverRows.filter((driver) => driver.status !== "Removed").map((driver) => ({
      id: driver.id,
      initials: driver.initials,
      name: driver.name,
      location: driver.location,
      vehicle: `${driver.vehicleMake} ${driver.vehicleModel} · ${driver.vehicleYear}`,
      checks: driver.checks,
      submitted: relativeTime(driver.submittedAt),
      status: driver.status,
    })),
    trips: tripRows.map((trip) => ({
      id: trip.publicId,
      route: `${trip.fromCity} → ${trip.toCity}`,
      driver: trip.driverName,
      departure: zaTime.format(trip.departureAt),
      date: zaDate.format(trip.departureAt),
      occupancy: `${trip.seatsBooked} / ${trip.seatCapacity}`,
      fare: money(trip.fareCents),
      status: trip.status,
    })),
    bookings: bookingRows.map((booking) => ({
      id: booking.id,
      passenger: booking.passenger,
      trip: `${booking.fromCity} → ${booking.toCity}`,
      seat: `${booking.seats} seat${booking.seats === 1 ? "" : "s"}`,
      amount: money(booking.amountCents),
      payment: booking.paymentStatus,
      status: booking.status,
    })),
    passengers: passengerRows.map((passenger) => ({
      id: passenger.id,
      name: passenger.name,
      contact: passenger.email,
      city: passenger.city,
      trips: String(passenger.tripsCount),
      joined: zaMonthYear.format(passenger.joinedAt),
      status: passenger.status,
    })),
    payments: paymentRows.map((payment) => ({
      ref: payment.ref,
      booking: payment.booking,
      customer: payment.customer,
      amount: money(payment.amountCents),
      method: payment.method,
      date: `${zaDate.format(payment.createdAt)} · ${zaTime.format(payment.createdAt)}`,
      status: payment.status,
    })),
    safetyCases: safetyRows.map((item) => ({
      id: item.publicId,
      databaseId: item.id,
      subject: item.subject,
      trip: item.tripLabel,
      priority: item.priority,
      owner: item.owner,
      created: relativeTime(item.createdAt),
      status: item.status,
    })),
    activity: activityRows.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      time: relativeTime(item.createdAt),
    })),
  };
}

export async function updateDriverStatus(id: string, status: string) {
  const db = getDb();
  const [driver] = await db
    .update(drivers)
    .set({ status, updatedAt: new Date() })
    .where(eq(drivers.id, id))
    .returning();

  if (!driver) return null;

  await db.insert(activityLogs).values({
    eventType: "driver_status",
    title: `Driver ${status.toLowerCase()}`,
    detail: driver.name,
    metadata: { driverId: driver.id, status },
  });

  return driver;
}


export async function getDriverDetails(id: string) {
  const db = getDb();

  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.id, id))
    .limit(1);

  if (!driver) return null;

  const [driverTrips, activity] = await Promise.all([
    db
      .select()
      .from(trips)
      .where(eq(trips.driverName, driver.name))
      .orderBy(desc(trips.departureAt))
      .limit(20),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(100),
  ]);

  return {
    driver: {
      id: driver.id,
      initials: driver.initials,
      name: driver.name,
      email: driver.email ?? "",
      phone: driver.phone ?? "",
      location: driver.location,
      vehicleMake: driver.vehicleMake,
      vehicleModel: driver.vehicleModel,
      vehicleYear: driver.vehicleYear,
      vehicle: `${driver.vehicleMake} ${driver.vehicleModel} · ${driver.vehicleYear}`,
      checks: driver.checks,
      status: driver.status,
      submittedAt: driver.submittedAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
    },
    trips: driverTrips.map((trip) => ({
      id: trip.publicId,
      route: `${trip.fromCity} → ${trip.toCity}`,
      departure: `${zaDate.format(trip.departureAt)} · ${zaTime.format(trip.departureAt)}`,
      occupancy: `${trip.seatsBooked} / ${trip.seatCapacity}`,
      fare: money(trip.fareCents),
      status: trip.status,
    })),
    activity: activity
      .filter((item) => item.metadata?.driverId === driver.id)
      .slice(0, 20)
      .map((item) => ({
        id: item.id,
        title: item.title,
        detail: item.detail,
        time: relativeTime(item.createdAt),
      })),
  };
}

export async function updateDriver(
  id: string,
  input: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    location?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    checks?: string;
    status?: string;
  }
) {
  const db = getDb();

  const [existing] = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
  if (!existing) return null;

  const updateValues = {
    ...input,
    updatedAt: new Date(),
  };

  const [driver] = await db
    .update(drivers)
    .set(updateValues)
    .where(eq(drivers.id, id))
    .returning();

  if (!driver) return null;

  const changedFields = Object.keys(input).filter(
    (key) => input[key as keyof typeof input] !== undefined
  );

  await db.insert(activityLogs).values({
    eventType: "driver_updated",
    title: "Driver profile updated",
    detail: `${driver.name} · ${changedFields.join(", ")}`,
    metadata: { driverId: driver.id, changedFields },
  });

  return driver;
}

export async function removeDriver(id: string) {
  const db = getDb();

  const [existing] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.id, id))
    .limit(1);

  if (!existing) return null;

  const [driver] = await db
    .update(drivers)
    .set({ status: "Removed", updatedAt: new Date() })
    .where(eq(drivers.id, id))
    .returning();

  if (!driver) return null;

  await db.insert(activityLogs).values({
    eventType: "driver_removed",
    title: "Driver removed from active CRM",
    detail: driver.name,
    metadata: { driverId: driver.id, previousStatus: existing.status },
  });

  return driver;
}

export async function createTrip(input: {
  from: string;
  to: string;
  driver: string;
  date: string;
  departure: string;
  seats: number;
  fareCents: number;
}) {
  const db = getDb();
  const publicId = `VY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const departureAt = new Date(`${input.date}T${input.departure}:00+02:00`);

  const [trip] = await db
    .insert(trips)
    .values({
      publicId,
      fromCity: input.from,
      toCity: input.to,
      driverName: input.driver,
      departureAt,
      seatCapacity: input.seats,
      fareCents: input.fareCents,
      status: "Scheduled",
    })
    .returning();

  await db.insert(activityLogs).values({
    eventType: "trip_created",
    title: "Trip created",
    detail: `${publicId} · ${input.from} → ${input.to}`,
    metadata: { tripId: trip.id, publicId },
  });

  return trip;
}

export async function createPassenger(input: {
  name: string;
  email: string;
  city: string;
}) {
  const db = getDb();

  const [passenger] = await db
    .insert(passengers)
    .values({
      name: input.name,
      email: input.email.toLowerCase(),
      city: input.city,
      status: "Active",
    })
    .returning();

  await db.insert(activityLogs).values({
    eventType: "passenger_created",
    title: "Passenger added",
    detail: `${input.name} · ${input.city}`,
    metadata: { passengerId: passenger.id },
  });

  return passenger;
}

export async function createSafetyCase(input: {
  subject: string;
  trip: string;
  priority: string;
  owner: string;
  note?: string;
}) {
  const db = getDb();
  const publicId = `SAFE-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  const [item] = await db
    .insert(safetyCases)
    .values({
      publicId,
      subject: input.subject,
      tripLabel: input.trip,
      priority: input.priority,
      owner: input.owner || "Unassigned",
      note: input.note || null,
      status: "Open",
    })
    .returning();

  await db.insert(activityLogs).values({
    eventType: "safety_case_created",
    title: "Safety case created",
    detail: `${publicId} · ${input.priority} priority`,
    metadata: { safetyCaseId: item.id, publicId },
  });

  return item;
}

function mapActivity(
  rows: Array<typeof activityLogs.$inferSelect>,
  predicate: (metadata: Record<string, unknown>) => boolean
) {
  return rows
    .filter((item) => predicate(item.metadata ?? {}))
    .slice(0, 25)
    .map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      time: relativeTime(item.createdAt),
    }));
}

export async function getPassengerDetails(id: string) {
  const db = getDb();
  const [passenger] = await db.select().from(passengers).where(eq(passengers.id, id)).limit(1);
  if (!passenger) return null;

  const [bookingRows, paymentRows, activityRows] = await Promise.all([
    db
      .select({
        id: bookings.publicId,
        tripId: trips.publicId,
        routeFrom: trips.fromCity,
        routeTo: trips.toCity,
        seats: bookings.seats,
        amountCents: bookings.amountCents,
        paymentStatus: bookings.paymentStatus,
        status: bookings.status,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .where(eq(bookings.passengerId, passenger.id))
      .orderBy(desc(bookings.createdAt)),
    db
      .select({
        ref: payments.publicId,
        booking: bookings.publicId,
        amountCents: payments.amountCents,
        method: payments.method,
        status: payments.status,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.passengerId, passenger.id))
      .orderBy(desc(payments.createdAt)),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(250),
  ]);

  return {
    passenger: {
      id: passenger.id,
      name: passenger.name,
      email: passenger.email,
      phone: passenger.phone ?? "",
      city: passenger.city,
      tripsCount: passenger.tripsCount,
      status: passenger.status,
      joinedAt: passenger.joinedAt.toISOString(),
      updatedAt: passenger.updatedAt.toISOString(),
    },
    bookings: bookingRows.map((booking) => ({
      id: booking.id,
      tripId: booking.tripId,
      route: `${booking.routeFrom} → ${booking.routeTo}`,
      seats: booking.seats,
      amount: money(booking.amountCents),
      payment: booking.paymentStatus,
      status: booking.status,
      created: `${zaDate.format(booking.createdAt)} · ${zaTime.format(booking.createdAt)}`,
    })),
    payments: paymentRows.map((payment) => ({
      ref: payment.ref,
      booking: payment.booking,
      amount: money(payment.amountCents),
      method: payment.method,
      status: payment.status,
      created: `${zaDate.format(payment.createdAt)} · ${zaTime.format(payment.createdAt)}`,
    })),
    activity: mapActivity(activityRows, (metadata) => metadata.passengerId === passenger.id),
  };
}

export async function updatePassenger(
  id: string,
  input: {
    name?: string;
    email?: string;
    phone?: string | null;
    city?: string;
    status?: string;
  }
) {
  const db = getDb();
  const [passenger] = await db
    .update(passengers)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(passengers.id, id))
    .returning();
  if (!passenger) return null;

  const changedFields = Object.keys(input);
  await db.insert(activityLogs).values({
    eventType: "passenger_updated",
    title: "Passenger profile updated",
    detail: `${passenger.name} · ${changedFields.join(", ")}`,
    metadata: { passengerId: passenger.id, changedFields },
  });

  return passenger;
}

export async function removePassenger(id: string) {
  const db = getDb();
  const [passenger] = await db
    .update(passengers)
    .set({ status: "Removed", updatedAt: new Date() })
    .where(eq(passengers.id, id))
    .returning();
  if (!passenger) return null;

  await db.insert(activityLogs).values({
    eventType: "passenger_removed",
    title: "Passenger removed from active CRM",
    detail: passenger.name,
    metadata: { passengerId: passenger.id },
  });

  return passenger;
}

export async function getTripDetails(publicId: string) {
  const db = getDb();
  const [trip] = await db.select().from(trips).where(eq(trips.publicId, publicId)).limit(1);
  if (!trip) return null;

  const [bookingRows, caseRows, activityRows] = await Promise.all([
    db
      .select({
        id: bookings.publicId,
        passengerId: passengers.id,
        passenger: passengers.name,
        seats: bookings.seats,
        amountCents: bookings.amountCents,
        paymentStatus: bookings.paymentStatus,
        status: bookings.status,
      })
      .from(bookings)
      .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
      .where(eq(bookings.tripId, trip.id))
      .orderBy(desc(bookings.createdAt)),
    db
      .select()
      .from(safetyCases)
      .where(eq(safetyCases.tripId, trip.id))
      .orderBy(desc(safetyCases.createdAt)),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(250),
  ]);

  return {
    trip: {
      id: trip.id,
      publicId: trip.publicId,
      fromCity: trip.fromCity,
      toCity: trip.toCity,
      driverId: trip.driverId ?? "",
      driverName: trip.driverName,
      departureAt: trip.departureAt.toISOString(),
      seatCapacity: trip.seatCapacity,
      seatsBooked: trip.seatsBooked,
      fareCents: trip.fareCents,
      fare: money(trip.fareCents),
      status: trip.status,
      createdAt: trip.createdAt.toISOString(),
      updatedAt: trip.updatedAt.toISOString(),
    },
    bookings: bookingRows.map((booking) => ({
      id: booking.id,
      passengerId: booking.passengerId,
      passenger: booking.passenger,
      seats: booking.seats,
      amount: money(booking.amountCents),
      payment: booking.paymentStatus,
      status: booking.status,
    })),
    safetyCases: caseRows.map((item) => ({
      id: item.publicId,
      subject: item.subject,
      priority: item.priority,
      owner: item.owner,
      status: item.status,
    })),
    activity: mapActivity(
      activityRows,
      (metadata) => metadata.tripId === trip.id || metadata.publicId === trip.publicId
    ),
  };
}

export async function updateTrip(
  publicId: string,
  input: {
    fromCity?: string;
    toCity?: string;
    driverName?: string;
    departureAt?: Date;
    seatCapacity?: number;
    fareCents?: number;
    status?: string;
  }
) {
  const db = getDb();
  let driverId: string | null | undefined = undefined;

  if (input.driverName) {
    const [driver] = await db.select().from(drivers).where(eq(drivers.name, input.driverName)).limit(1);
    driverId = driver?.id ?? null;
  }

  const [trip] = await db
    .update(trips)
    .set({
      ...input,
      ...(driverId !== undefined ? { driverId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(trips.publicId, publicId))
    .returning();
  if (!trip) return null;

  const changedFields = Object.keys(input);
  await db.insert(activityLogs).values({
    eventType: "trip_updated",
    title: "Trip updated",
    detail: `${trip.publicId} · ${changedFields.join(", ")}`,
    metadata: { tripId: trip.id, publicId: trip.publicId, changedFields },
  });

  return trip;
}

export async function getBookingDetails(publicId: string) {
  const db = getDb();
  const [booking] = await db
    .select({
      id: bookings.id,
      publicId: bookings.publicId,
      seats: bookings.seats,
      amountCents: bookings.amountCents,
      paymentStatus: bookings.paymentStatus,
      status: bookings.status,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      passengerId: passengers.id,
      passengerName: passengers.name,
      passengerEmail: passengers.email,
      tripId: trips.publicId,
      tripDatabaseId: trips.id,
      fromCity: trips.fromCity,
      toCity: trips.toCity,
      departureAt: trips.departureAt,
      driverName: trips.driverName,
    })
    .from(bookings)
    .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(eq(bookings.publicId, publicId))
    .limit(1);

  if (!booking) return null;

  const [paymentRows, activityRows] = await Promise.all([
    db.select().from(payments).where(eq(payments.bookingId, booking.id)).orderBy(desc(payments.createdAt)),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(250),
  ]);

  return {
    booking: {
      id: booking.id,
      publicId: booking.publicId,
      seats: booking.seats,
      amountCents: booking.amountCents,
      amount: money(booking.amountCents),
      paymentStatus: booking.paymentStatus,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    },
    passenger: {
      id: booking.passengerId,
      name: booking.passengerName,
      email: booking.passengerEmail,
    },
    trip: {
      id: booking.tripId,
      databaseId: booking.tripDatabaseId,
      route: `${booking.fromCity} → ${booking.toCity}`,
      departure: `${zaDate.format(booking.departureAt)} · ${zaTime.format(booking.departureAt)}`,
      driver: booking.driverName,
    },
    payments: paymentRows.map((payment) => ({
      ref: payment.publicId,
      amount: money(payment.amountCents),
      method: payment.method,
      status: payment.status,
      created: `${zaDate.format(payment.createdAt)} · ${zaTime.format(payment.createdAt)}`,
    })),
    activity: mapActivity(
      activityRows,
      (metadata) => metadata.bookingId === booking.id || metadata.booking === booking.publicId
    ),
  };
}

export async function updateBooking(
  publicId: string,
  input: {
    seats?: number;
    amountCents?: number;
    paymentStatus?: string;
    status?: string;
  }
) {
  const db = getDb();
  const [booking] = await db
    .update(bookings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(bookings.publicId, publicId))
    .returning();
  if (!booking) return null;

  const changedFields = Object.keys(input);
  await db.insert(activityLogs).values({
    eventType: "booking_updated",
    title: "Booking updated",
    detail: `${booking.publicId} · ${changedFields.join(", ")}`,
    metadata: { bookingId: booking.id, booking: booking.publicId, changedFields },
  });

  return booking;
}

export async function getPaymentDetails(publicId: string) {
  const db = getDb();
  const [payment] = await db
    .select({
      id: payments.id,
      publicId: payments.publicId,
      amountCents: payments.amountCents,
      method: payments.method,
      status: payments.status,
      createdAt: payments.createdAt,
      bookingId: bookings.publicId,
      bookingDatabaseId: bookings.id,
      passengerId: passengers.id,
      passengerName: passengers.name,
      passengerEmail: passengers.email,
      tripId: trips.publicId,
      fromCity: trips.fromCity,
      toCity: trips.toCity,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(eq(payments.publicId, publicId))
    .limit(1);
  if (!payment) return null;

  const activityRows = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(250);

  return {
    payment: {
      id: payment.id,
      publicId: payment.publicId,
      amountCents: payment.amountCents,
      amount: money(payment.amountCents),
      method: payment.method,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
    },
    booking: {
      id: payment.bookingId,
      databaseId: payment.bookingDatabaseId,
    },
    passenger: {
      id: payment.passengerId,
      name: payment.passengerName,
      email: payment.passengerEmail,
    },
    trip: {
      id: payment.tripId,
      route: `${payment.fromCity} → ${payment.toCity}`,
    },
    activity: mapActivity(
      activityRows,
      (metadata) => metadata.paymentId === payment.id || metadata.payment === payment.publicId
    ),
  };
}

export async function updatePayment(
  publicId: string,
  input: {
    amountCents?: number;
    method?: string;
    status?: string;
  }
) {
  const db = getDb();
  const [payment] = await db
    .update(payments)
    .set(input)
    .where(eq(payments.publicId, publicId))
    .returning();
  if (!payment) return null;

  const changedFields = Object.keys(input);
  await db.insert(activityLogs).values({
    eventType: "payment_updated",
    title: "Payment updated",
    detail: `${payment.publicId} · ${changedFields.join(", ")}`,
    metadata: { paymentId: payment.id, payment: payment.publicId, changedFields },
  });

  return payment;
}

export async function getSafetyCaseDetails(publicId: string) {
  const db = getDb();
  const [item] = await db
    .select()
    .from(safetyCases)
    .where(eq(safetyCases.publicId, publicId))
    .limit(1);
  if (!item) return null;

  let linkedTrip = null;
  if (item.tripId) {
    const [trip] = await db.select().from(trips).where(eq(trips.id, item.tripId)).limit(1);
    linkedTrip = trip
      ? {
          id: trip.publicId,
          route: `${trip.fromCity} → ${trip.toCity}`,
          driver: trip.driverName,
          status: trip.status,
        }
      : null;
  }

  const activityRows = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(250);

  return {
    safetyCase: {
      id: item.id,
      publicId: item.publicId,
      subject: item.subject,
      tripLabel: item.tripLabel,
      priority: item.priority,
      owner: item.owner,
      note: item.note ?? "",
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    },
    trip: linkedTrip,
    activity: mapActivity(
      activityRows,
      (metadata) => metadata.safetyCaseId === item.id || metadata.publicId === item.publicId
    ),
  };
}

export async function updateSafetyCase(
  publicId: string,
  input: {
    subject?: string;
    priority?: string;
    owner?: string;
    note?: string | null;
    status?: string;
  }
) {
  const db = getDb();
  const [item] = await db
    .update(safetyCases)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(safetyCases.publicId, publicId))
    .returning();
  if (!item) return null;

  const changedFields = Object.keys(input);
  await db.insert(activityLogs).values({
    eventType: "safety_case_updated",
    title: "Safety case updated",
    detail: `${item.publicId} · ${changedFields.join(", ")}`,
    metadata: { safetyCaseId: item.id, publicId: item.publicId, changedFields },
  });

  return item;
}

