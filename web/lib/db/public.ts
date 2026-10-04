import "server-only";

import { and, asc, desc, eq, gte, ilike, lt, ne, or, sql } from "drizzle-orm";
import { getDb } from "./index";
import { activityLogs, bookings, drivers, passengers, payments, trips } from "./schema";

const PUBLIC_TRIP_STATUSES = ["Scheduled", "On schedule", "Boarding", "Full"];

function money(cents: number) {
  return `R${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function publicTripShape(row: {
  id: string;
  publicId: string;
  fromCity: string;
  toCity: string;
  driverName: string;
  departureAt: Date;
  seatCapacity: number;
  seatsBooked: number;
  fareCents: number;
  status: string;
  driverStatus: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  driverLocation: string | null;
}) {
  const availableSeats = Math.max(0, row.seatCapacity - row.seatsBooked);

  return {
    id: row.publicId,
    databaseId: row.id,
    from: row.fromCity,
    to: row.toCity,
    driver: {
      name: row.driverName,
      verified: row.driverStatus === "Approved",
      location: row.driverLocation ?? "",
      vehicle:
        row.vehicleMake && row.vehicleModel
          ? `${row.vehicleMake} ${row.vehicleModel}${row.vehicleYear ? ` · ${row.vehicleYear}` : ""}`
          : "Vehicle details pending",
    },
    departureAt: row.departureAt.toISOString(),
    seatCapacity: row.seatCapacity,
    seatsBooked: row.seatsBooked,
    availableSeats,
    fareCents: row.fareCents,
    fare: money(row.fareCents),
    status: row.status,
  };
}

export async function searchPublicTrips(input: {
  from?: string;
  to?: string;
  date?: string;
  passengers?: number;
}) {
  const db = getDb();
  const passengersRequested = Math.max(1, Math.min(8, input.passengers ?? 1));

  const conditions = [
    or(...PUBLIC_TRIP_STATUSES.map((status) => eq(trips.status, status))),
    sql`${trips.seatCapacity} - ${trips.seatsBooked} >= ${passengersRequested}`,
  ];

  if (input.from?.trim()) {
    conditions.push(ilike(trips.fromCity, input.from.trim()));
  }

  if (input.to?.trim()) {
    conditions.push(ilike(trips.toCity, input.to.trim()));
  }

  if (input.date) {
    const start = new Date(`${input.date}T00:00:00+02:00`);
    const end = new Date(`${input.date}T23:59:59.999+02:00`);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      conditions.push(gte(trips.departureAt, start));
      conditions.push(lt(trips.departureAt, end));
    }
  } else {
    conditions.push(gte(trips.departureAt, new Date()));
  }

  const rows = await db
    .select({
      id: trips.id,
      publicId: trips.publicId,
      fromCity: trips.fromCity,
      toCity: trips.toCity,
      driverName: trips.driverName,
      departureAt: trips.departureAt,
      seatCapacity: trips.seatCapacity,
      seatsBooked: trips.seatsBooked,
      fareCents: trips.fareCents,
      status: trips.status,
      driverStatus: drivers.status,
      vehicleMake: drivers.vehicleMake,
      vehicleModel: drivers.vehicleModel,
      vehicleYear: drivers.vehicleYear,
      driverLocation: drivers.location,
    })
    .from(trips)
    .leftJoin(drivers, eq(trips.driverId, drivers.id))
    .where(and(...conditions))
    .orderBy(asc(trips.departureAt))
    .limit(50);

  return rows.map(publicTripShape);
}

export async function getPublicTrip(publicId: string) {
  const db = getDb();

  const [row] = await db
    .select({
      id: trips.id,
      publicId: trips.publicId,
      fromCity: trips.fromCity,
      toCity: trips.toCity,
      driverName: trips.driverName,
      departureAt: trips.departureAt,
      seatCapacity: trips.seatCapacity,
      seatsBooked: trips.seatsBooked,
      fareCents: trips.fareCents,
      status: trips.status,
      driverStatus: drivers.status,
      vehicleMake: drivers.vehicleMake,
      vehicleModel: drivers.vehicleModel,
      vehicleYear: drivers.vehicleYear,
      driverLocation: drivers.location,
    })
    .from(trips)
    .leftJoin(drivers, eq(trips.driverId, drivers.id))
    .where(eq(trips.publicId, publicId))
    .limit(1);

  if (!row) return null;

  return publicTripShape(row);
}

export async function createPublicBooking(input: {
  tripId: string;
  seats: number;
  passenger: {
    name: string;
    email: string;
    city: string;
  };
}) {
  const db = getDb();
  const seatsRequested = Math.max(1, Math.min(8, input.seats));
  const email = input.passenger.email.trim().toLowerCase();

  return db.transaction(async (tx) => {
    let [passenger] = await tx
      .select()
      .from(passengers)
      .where(eq(passengers.email, email))
      .limit(1);

    if (!passenger) {
      [passenger] = await tx
        .insert(passengers)
        .values({
          name: input.passenger.name.trim(),
          email,
          city: input.passenger.city.trim(),
          status: "Active",
        })
        .returning();
    } else if (passenger.status === "Removed" || passenger.status === "Suspended") {
      throw new Error("PASSENGER_BLOCKED");
    }

    const [trip] = await tx
      .update(trips)
      .set({
        seatsBooked: sql`${trips.seatsBooked} + ${seatsRequested}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trips.publicId, input.tripId),
          or(...PUBLIC_TRIP_STATUSES.map((status) => eq(trips.status, status))),
          sql`${trips.seatCapacity} - ${trips.seatsBooked} >= ${seatsRequested}`
        )
      )
      .returning();

    if (!trip) {
      throw new Error("TRIP_UNAVAILABLE");
    }

    const publicId = `BK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const amountCents = trip.fareCents * seatsRequested;

    const [booking] = await tx
      .insert(bookings)
      .values({
        publicId,
        tripId: trip.id,
        passengerId: passenger.id,
        seats: seatsRequested,
        amountCents,
        paymentStatus: "Pending",
        status: "Awaiting payment",
      })
      .returning();

    await tx
      .update(passengers)
      .set({
        tripsCount: sql`${passengers.tripsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(passengers.id, passenger.id));

    await tx.insert(activityLogs).values({
      eventType: "booking_created",
      title: "Booking created",
      detail: `${booking.publicId} · ${trip.fromCity} → ${trip.toCity}`,
      metadata: {
        bookingId: booking.id,
        booking: booking.publicId,
        passengerId: passenger.id,
        tripId: trip.id,
        publicId: trip.publicId,
      },
    });

    return {
      id: booking.publicId,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      seats: booking.seats,
      amountCents: booking.amountCents,
      amount: money(booking.amountCents),
      trip: {
        id: trip.publicId,
        route: `${trip.fromCity} → ${trip.toCity}`,
        departureAt: trip.departureAt.toISOString(),
      },
      passenger: {
        id: passenger.id,
        name: passenger.name,
        email: passenger.email,
      },
    };
  });
}


export async function ensurePassengerForAuthUser(input: {
  name: string;
  email: string;
  city: string;
}) {
  const db = getDb();
  const email = input.email.trim().toLowerCase();

  let [passenger] = await db
    .select()
    .from(passengers)
    .where(eq(passengers.email, email))
    .limit(1);

  if (!passenger) {
    [passenger] = await db
      .insert(passengers)
      .values({
        name: input.name.trim(),
        email,
        city: input.city.trim(),
        status: "Active",
      })
      .returning();

    await db.insert(activityLogs).values({
      eventType: "passenger_created",
      title: "Passenger account created",
      detail: `${passenger.name} · ${passenger.city}`,
      metadata: { passengerId: passenger.id, source: "mobile_auth" },
    });
  }

  return {
    id: passenger.id,
    name: passenger.name,
    email: passenger.email,
    phone: passenger.phone ?? "",
    city: passenger.city,
    status: passenger.status,
  };
}

export async function getPassengerAccountByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [passenger] = await db
    .select()
    .from(passengers)
    .where(eq(passengers.email, normalized))
    .limit(1);

  if (!passenger) return null;

  return {
    id: passenger.id,
    name: passenger.name,
    email: passenger.email,
    phone: passenger.phone ?? "",
    city: passenger.city,
    status: passenger.status,
    tripsCount: passenger.tripsCount,
    joinedAt: passenger.joinedAt.toISOString(),
  };
}

export async function getPassengerTripsByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const rows = await db
    .select({
      bookingId: bookings.publicId,
      bookingStatus: bookings.status,
      paymentStatus: bookings.paymentStatus,
      seats: bookings.seats,
      amountCents: bookings.amountCents,
      createdAt: bookings.createdAt,
      tripId: trips.publicId,
      fromCity: trips.fromCity,
      toCity: trips.toCity,
      departureAt: trips.departureAt,
      driverName: trips.driverName,
      tripStatus: trips.status,
    })
    .from(bookings)
    .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(eq(passengers.email, normalized))
    .orderBy(desc(bookings.createdAt));

  return rows.map((row) => ({
    id: row.bookingId,
    route: `${row.fromCity} → ${row.toCity}`,
    tripId: row.tripId,
    driver: row.driverName,
    departureAt: row.departureAt.toISOString(),
    seats: row.seats,
    amountCents: row.amountCents,
    amount: money(row.amountCents),
    bookingStatus: row.bookingStatus,
    paymentStatus: row.paymentStatus,
    tripStatus: row.tripStatus,
    createdAt: row.createdAt.toISOString(),
  }));
}


export async function getPassengerBookingForPayment(
  bookingPublicId: string,
  email: string
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [row] = await db
    .select({
      bookingId: bookings.id,
      bookingPublicId: bookings.publicId,
      bookingStatus: bookings.status,
      paymentStatus: bookings.paymentStatus,
      amountCents: bookings.amountCents,
      passengerId: passengers.id,
      passengerName: passengers.name,
      passengerEmail: passengers.email,
      tripId: trips.publicId,
      fromCity: trips.fromCity,
      toCity: trips.toCity,
      departureAt: trips.departureAt,
    })
    .from(bookings)
    .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(
      and(
        eq(bookings.publicId, bookingPublicId),
        eq(passengers.email, normalized)
      )
    )
    .limit(1);

  if (!row) return null;

  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.bookingId, row.bookingId))
    .orderBy(desc(payments.createdAt));

  return {
    id: row.bookingPublicId,
    databaseId: row.bookingId,
    status: row.bookingStatus,
    paymentStatus: row.paymentStatus,
    amountCents: row.amountCents,
    amount: money(row.amountCents),
    passenger: {
      id: row.passengerId,
      name: row.passengerName,
      email: row.passengerEmail,
    },
    trip: {
      id: row.tripId,
      route: `${row.fromCity} → ${row.toCity}`,
      departureAt: row.departureAt.toISOString(),
    },
    payments: paymentRows.map((payment) => ({
      reference: payment.publicId,
      amountCents: payment.amountCents,
      amount: money(payment.amountCents),
      method: payment.method,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
    })),
  };
}

export async function createPendingMobilePayment(input: {
  bookingDatabaseId: string;
  reference: string;
  amountCents: number;
}) {
  const db = getDb();

  const [payment] = await db
    .insert(payments)
    .values({
      publicId: input.reference,
      bookingId: input.bookingDatabaseId,
      amountCents: input.amountCents,
      method: "Paystack",
      status: "Pending",
    })
    .returning();

  await db.insert(activityLogs).values({
    eventType: "payment_initialized",
    title: "Payment initialized",
    detail: `${payment.publicId} · ${money(payment.amountCents)}`,
    metadata: {
      paymentId: payment.id,
      payment: payment.publicId,
      bookingId: input.bookingDatabaseId,
    },
  });

  return payment;
}

export async function getMobilePayment(reference: string) {
  const db = getDb();

  const [row] = await db
    .select({
      id: payments.id,
      publicId: payments.publicId,
      amountCents: payments.amountCents,
      status: payments.status,
      bookingDatabaseId: bookings.id,
      bookingPublicId: bookings.publicId,
      bookingStatus: bookings.status,
      paymentStatus: bookings.paymentStatus,
      passengerEmail: passengers.email,
      tripPublicId: trips.publicId,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(eq(payments.publicId, reference))
    .limit(1);

  return row ?? null;
}

export async function settleMobilePayment(reference: string) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [payment] = await tx
      .update(payments)
      .set({ status: "Settled" })
      .where(eq(payments.publicId, reference))
      .returning();

    if (!payment) return null;

    const [booking] = await tx
      .update(bookings)
      .set({
        paymentStatus: "Paid",
        status: "Confirmed",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, payment.bookingId))
      .returning();

    await tx.insert(activityLogs).values({
      eventType: "payment_settled",
      title: "Payment settled",
      detail: `${payment.publicId} · ${money(payment.amountCents)}`,
      metadata: {
        paymentId: payment.id,
        payment: payment.publicId,
        bookingId: payment.bookingId,
        booking: booking?.publicId,
      },
    });

    return { payment, booking };
  });
}

export async function failMobilePayment(reference: string) {
  const db = getDb();

  const [payment] = await db
    .update(payments)
    .set({ status: "Failed" })
    .where(
      and(
        eq(payments.publicId, reference),
        ne(payments.status, "Settled")
      )
    )
    .returning();

  if (!payment) return null;

  await db.insert(activityLogs).values({
    eventType: "payment_failed",
    title: "Payment failed",
    detail: payment.publicId,
    metadata: {
      paymentId: payment.id,
      payment: payment.publicId,
      bookingId: payment.bookingId,
    },
  });

  return payment;
}
