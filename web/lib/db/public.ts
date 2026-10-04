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


export async function getMobileDriverByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.email, normalized))
    .limit(1);

  if (!driver) return null;

  const driverTrips = await db
    .select()
    .from(trips)
    .where(eq(trips.driverId, driver.id))
    .orderBy(desc(trips.departureAt));

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
    },
    trips: driverTrips.map((trip) => ({
      id: trip.publicId,
      route: `${trip.fromCity} → ${trip.toCity}`,
      from: trip.fromCity,
      to: trip.toCity,
      departureAt: trip.departureAt.toISOString(),
      seatCapacity: trip.seatCapacity,
      seatsBooked: trip.seatsBooked,
      availableSeats: Math.max(0, trip.seatCapacity - trip.seatsBooked),
      fareCents: trip.fareCents,
      fare: money(trip.fareCents),
      status: trip.status,
    })),
  };
}

export async function createMobileDriverApplication(input: {
  name: string;
  email: string;
  phone?: string;
  location: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
}) {
  const db = getDb();
  const email = input.email.trim().toLowerCase();

  const [existing] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.email, email))
    .limit(1);

  if (existing) {
    throw new Error("DRIVER_ALREADY_EXISTS");
  }

  const initials =
    input.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((value) => value[0])
      .join("")
      .slice(0, 4)
      .toUpperCase() || "VD";

  const [driver] = await db
    .insert(drivers)
    .values({
      initials,
      name: input.name.trim(),
      email,
      phone: input.phone?.trim() || null,
      location: input.location.trim(),
      vehicleMake: input.vehicleMake.trim(),
      vehicleModel: input.vehicleModel.trim(),
      vehicleYear: input.vehicleYear,
      checks: "Identity, licence and vehicle review pending",
      status: "Review",
    })
    .returning();

  await db.insert(activityLogs).values({
    eventType: "driver_application",
    title: "Driver application submitted",
    detail: `${driver.name} · ${driver.location}`,
    metadata: {
      driverId: driver.id,
      email,
      source: "mobile",
    },
  });

  return {
    id: driver.id,
    name: driver.name,
    email: driver.email ?? "",
    location: driver.location,
    vehicle: `${driver.vehicleMake} ${driver.vehicleModel} · ${driver.vehicleYear}`,
    checks: driver.checks,
    status: driver.status,
  };
}

export async function createMobileDriverTrip(
  email: string,
  input: {
    from: string;
    to: string;
    departureAt: Date;
    seats: number;
    fareCents: number;
  }
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.email, normalized))
    .limit(1);

  if (!driver) throw new Error("DRIVER_NOT_FOUND");
  if (driver.status !== "Approved") throw new Error("DRIVER_NOT_APPROVED");

  const publicId = `VY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const [trip] = await db
    .insert(trips)
    .values({
      publicId,
      fromCity: input.from.trim(),
      toCity: input.to.trim(),
      driverId: driver.id,
      driverName: driver.name,
      departureAt: input.departureAt,
      seatCapacity: input.seats,
      seatsBooked: 0,
      fareCents: input.fareCents,
      status: "Scheduled",
    })
    .returning();

  await db.insert(activityLogs).values({
    eventType: "driver_trip_created",
    title: "Driver published a trip",
    detail: `${trip.publicId} · ${trip.fromCity} → ${trip.toCity}`,
    metadata: {
      driverId: driver.id,
      tripId: trip.id,
      publicId: trip.publicId,
      source: "mobile",
    },
  });

  return {
    id: trip.publicId,
    route: `${trip.fromCity} → ${trip.toCity}`,
    departureAt: trip.departureAt.toISOString(),
    seatCapacity: trip.seatCapacity,
    seatsBooked: trip.seatsBooked,
    fareCents: trip.fareCents,
    fare: money(trip.fareCents),
    status: trip.status,
  };
}

export async function updateMobileDriverTripStatus(
  email: string,
  publicId: string,
  status: "Scheduled" | "On schedule" | "Boarding" | "Completed" | "Cancelled"
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.email, normalized))
    .limit(1);

  if (!driver) throw new Error("DRIVER_NOT_FOUND");
  if (driver.status !== "Approved") throw new Error("DRIVER_NOT_APPROVED");

  const [trip] = await db
    .update(trips)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(trips.publicId, publicId),
        eq(trips.driverId, driver.id)
      )
    )
    .returning();

  if (!trip) throw new Error("TRIP_NOT_FOUND");

  if (status === "Cancelled") {
    await db
      .update(bookings)
      .set({ status: "Cancelled", updatedAt: new Date() })
      .where(eq(bookings.tripId, trip.id));
  } else if (status === "Completed") {
    await db
      .update(bookings)
      .set({ status: "Completed", updatedAt: new Date() })
      .where(
        and(
          eq(bookings.tripId, trip.id),
          ne(bookings.status, "Cancelled")
        )
      );
  }

  await db.insert(activityLogs).values({
    eventType: "driver_trip_status",
    title: `Trip ${status.toLowerCase()}`,
    detail: `${trip.publicId} · ${trip.fromCity} → ${trip.toCity}`,
    metadata: {
      driverId: driver.id,
      tripId: trip.id,
      publicId: trip.publicId,
      status,
      source: "mobile",
    },
  });

  return {
    id: trip.publicId,
    status: trip.status,
  };
}
