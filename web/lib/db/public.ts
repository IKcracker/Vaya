import "server-only";

import { and, asc, desc, eq, gte, ilike, lt, ne, or, sql } from "drizzle-orm";
import { getDb } from "./index";
import {
  getDriverVerificationSummary,
  getVehicleVerificationSummary,
} from "./driver-documents";
import {
  activityLogs,
  bookings,
  driverDocuments,
  drivers,
  driverVehicles,
  passengers,
  payments,
  safetyCases,
  trips,
} from "./schema";

const PUBLIC_TRIP_STATUSES = ["Scheduled", "On schedule", "Boarding", "Full"];

const passengerAccountSelection = {
  id: passengers.id,
  name: passengers.name,
  email: passengers.email,
  phone: passengers.phone,
  city: passengers.city,
  tripsCount: passengers.tripsCount,
  status: passengers.status,
  joinedAt: passengers.joinedAt,
  updatedAt: passengers.updatedAt,
  profileImageUpdatedAt: passengers.profileImageUpdatedAt,
};

const verifiedDriver = sql<boolean>`coalesce(
  ${drivers.status} = 'Approved'
  and exists (
    select 1
    from driver_vehicles verified_vehicle
    where verified_vehicle.id = ${trips.vehicleId}
      and verified_vehicle.status = 'Approved'
  ),
  false
)`;

function money(cents: number) {
  return `R${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function publicTripShape(row: {
  id: string;
  publicId: string;
  fromCity: string;
  toCity: string;
  driverName: string;
  driverId: string | null;
  driverProfileImageUpdatedAt: Date | null;
  departureAt: Date;
  seatCapacity: number;
  seatsBooked: number;
  fareCents: number;
  status: string;
  driverStatus: string | null;
  driverIsVerified: boolean;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehicleRegistration: string | null;
  vehicleColor: string | null;
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
      verified: row.driverIsVerified,
      location: row.driverLocation ?? "",
      profileImageUrl:
        row.driverId &&
        row.driverStatus === "Approved" &&
        row.driverProfileImageUpdatedAt
          ? `/api/public/drivers/${row.driverId}/profile-image?version=${row.driverProfileImageUpdatedAt.getTime()}`
          : "",
      vehicle:
        row.vehicleMake && row.vehicleModel
          ? `${row.vehicleMake} ${row.vehicleModel}${row.vehicleYear ? ` · ${row.vehicleYear}` : ""}`
          : "Vehicle details pending",
      vehicleRegistration: row.vehicleRegistration ?? "",
      vehicleColor: row.vehicleColor ?? "",
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
      driverId: drivers.id,
      driverProfileImageUpdatedAt: passengers.profileImageUpdatedAt,
      departureAt: trips.departureAt,
      seatCapacity: trips.seatCapacity,
      seatsBooked: trips.seatsBooked,
      fareCents: trips.fareCents,
      status: trips.status,
      driverStatus: drivers.status,
      driverIsVerified: verifiedDriver,
      vehicleMake: trips.vehicleMake,
      vehicleModel: trips.vehicleModel,
      vehicleYear: trips.vehicleYear,
      vehicleRegistration: trips.vehicleRegistration,
      vehicleColor: trips.vehicleColor,
      driverLocation: drivers.location,
    })
    .from(trips)
    .leftJoin(drivers, eq(trips.driverId, drivers.id))
    .leftJoin(passengers, eq(passengers.email, drivers.email))
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
      driverId: drivers.id,
      driverProfileImageUpdatedAt: passengers.profileImageUpdatedAt,
      departureAt: trips.departureAt,
      seatCapacity: trips.seatCapacity,
      seatsBooked: trips.seatsBooked,
      fareCents: trips.fareCents,
      status: trips.status,
      driverStatus: drivers.status,
      driverIsVerified: verifiedDriver,
      vehicleMake: trips.vehicleMake,
      vehicleModel: trips.vehicleModel,
      vehicleYear: trips.vehicleYear,
      vehicleRegistration: trips.vehicleRegistration,
      vehicleColor: trips.vehicleColor,
      driverLocation: drivers.location,
    })
    .from(trips)
    .leftJoin(drivers, eq(trips.driverId, drivers.id))
    .leftJoin(passengers, eq(passengers.email, drivers.email))
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
      .select(passengerAccountSelection)
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
        .returning(passengerAccountSelection);
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
    .select(passengerAccountSelection)
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
      .returning(passengerAccountSelection);

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
    profileImageUrl: passenger.profileImageUpdatedAt
      ? `/api/mobile/me/photo?version=${passenger.profileImageUpdatedAt.getTime()}`
      : "",
  };
}

export async function getPassengerAccountByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [passenger] = await db
    .select(passengerAccountSelection)
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
    profileImageUrl: passenger.profileImageUpdatedAt
      ? `/api/mobile/me/photo?version=${passenger.profileImageUpdatedAt.getTime()}`
      : "",
  };
}

export async function updatePassengerAccountByEmail(
  email: string,
  input: {
    name: string;
    phone?: string | null;
    city: string;
  }
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [passenger] = await db
    .update(passengers)
    .set({
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      city: input.city.trim(),
      updatedAt: new Date(),
    })
    .where(eq(passengers.email, normalized))
    .returning(passengerAccountSelection);

  if (!passenger) return null;

  await db.insert(activityLogs).values({
    eventType: "passenger_profile_updated",
    title: "Passenger profile updated",
    detail: passenger.name,
    metadata: {
      passengerId: passenger.id,
      source: "mobile",
      fields: ["name", "phone", "city"],
    },
  });

  return {
    id: passenger.id,
    name: passenger.name,
    email: passenger.email,
    phone: passenger.phone ?? "",
    city: passenger.city,
    status: passenger.status,
    tripsCount: passenger.tripsCount,
    joinedAt: passenger.joinedAt.toISOString(),
    profileImageUrl: passenger.profileImageUpdatedAt
      ? `/api/mobile/me/photo?version=${passenger.profileImageUpdatedAt.getTime()}`
      : "",
  };
}

export async function getPassengerPaymentsByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const rows = await db
    .select({
      reference: payments.publicId,
      bookingId: bookings.publicId,
      amountCents: payments.amountCents,
      method: payments.method,
      status: payments.status,
      createdAt: payments.createdAt,
      fromCity: trips.fromCity,
      toCity: trips.toCity,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .where(eq(passengers.email, normalized))
    .orderBy(desc(payments.createdAt));

  return rows.map((row) => ({
    reference: row.reference,
    bookingId: row.bookingId,
    amountCents: row.amountCents,
    amount: money(row.amountCents),
    method: row.method,
    status: row.status,
    route: `${row.fromCity} → ${row.toCity}`,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createMobileSafetyCaseByEmail(
  email: string,
  input: {
    tripId?: string | null;
    subject: string;
    note: string;
  }
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [passenger] = await db
    .select(passengerAccountSelection)
    .from(passengers)
    .where(eq(passengers.email, normalized))
    .limit(1);

  if (!passenger) throw new Error("PASSENGER_NOT_FOUND");

  let linkedTrip:
    | {
        id: string;
        publicId: string;
        fromCity: string;
        toCity: string;
      }
    | undefined;

  if (input.tripId) {
    [linkedTrip] = await db
      .select({
        id: trips.id,
        publicId: trips.publicId,
        fromCity: trips.fromCity,
        toCity: trips.toCity,
      })
      .from(bookings)
      .innerJoin(trips, eq(bookings.tripId, trips.id))
      .where(
        and(
          eq(bookings.passengerId, passenger.id),
          eq(trips.publicId, input.tripId)
        )
      )
      .limit(1);

    if (!linkedTrip) throw new Error("TRIP_NOT_FOUND");
  }

  const publicId = `SAFE-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const tripLabel = linkedTrip
    ? `${linkedTrip.publicId} · ${linkedTrip.fromCity} → ${linkedTrip.toCity}`
    : `Passenger · ${passenger.name}`;

  const [safetyCase] = await db
    .insert(safetyCases)
    .values({
      publicId,
      subject: input.subject.trim(),
      tripId: linkedTrip?.id ?? null,
      tripLabel,
      priority: "High",
      owner: "Unassigned",
      note: input.note.trim(),
      status: "Open",
    })
    .returning();

  await db.insert(activityLogs).values({
    eventType: "mobile_safety_case_created",
    title: "Passenger safety report submitted",
    detail: `${safetyCase.publicId} · ${passenger.name}`,
    metadata: {
      safetyCaseId: safetyCase.id,
      publicId: safetyCase.publicId,
      passengerId: passenger.id,
      tripId: linkedTrip?.id ?? null,
      source: "mobile",
    },
  });

  return {
    id: safetyCase.publicId,
    subject: safetyCase.subject,
    status: safetyCase.status,
    priority: safetyCase.priority,
    trip: tripLabel,
    createdAt: safetyCase.createdAt.toISOString(),
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
      driverId: trips.driverId,
      driverStatus: sql<string | null>`(select d.status from drivers d where d.id = ${trips.driverId} limit 1)`,
      driverProfileImageUpdatedAt: sql<Date | null>`(
        select p.profile_image_updated_at
        from passengers p
        join drivers d on lower(d.email) = lower(p.email)
        where d.id = ${trips.driverId}
        limit 1
      )`,
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
    driverProfileImageUrl:
      row.driverId &&
      row.driverStatus === "Approved" &&
      row.driverProfileImageUpdatedAt
        ? `/api/public/drivers/${row.driverId}/profile-image?version=${new Date(row.driverProfileImageUpdatedAt).getTime()}`
        : "",
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

  const [driverTrips, verification, vehicleRows, passenger, reviewSummary] = await Promise.all([
    db
      .select()
      .from(trips)
      .where(eq(trips.driverId, driver.id))
      .orderBy(desc(trips.departureAt)),
    getDriverVerificationSummary(driver.id),
    db
      .select()
      .from(driverVehicles)
      .where(eq(driverVehicles.driverId, driver.id))
      .orderBy(desc(driverVehicles.isPrimary), desc(driverVehicles.createdAt)),
    db
      .select({ profileImageUpdatedAt: passengers.profileImageUpdatedAt })
      .from(passengers)
      .where(eq(passengers.email, normalized))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    getDriverReviewSummary(driver.id),
  ]);

  const vehicles = await Promise.all(
    vehicleRows.map(async (vehicle) => {
      const vehicleVerification = await getVehicleVerificationSummary(
        driver.id,
        vehicle.id
      );
      return {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        registration: vehicle.registration,
        color: vehicle.color,
        status: vehicle.status,
        checks: vehicle.checks,
        isPrimary: vehicle.isPrimary,
        label: `${vehicle.make} ${vehicle.model} · ${vehicle.year}`,
        verification: vehicleVerification,
      };
    })
  );

  const primaryVehicle = vehicles.find((vehicle) => vehicle.isPrimary) ?? vehicles[0];

  return {
    driver: {
      id: driver.id,
      initials: driver.initials,
      name: driver.name,
      email: driver.email ?? "",
      phone: driver.phone ?? "",
      location: driver.location,
      vehicle: primaryVehicle?.label ?? "",
      vehicleMake: primaryVehicle?.make ?? driver.vehicleMake,
      vehicleModel: primaryVehicle?.model ?? driver.vehicleModel,
      vehicleYear: primaryVehicle?.year ?? driver.vehicleYear,
      vehicleRegistration: primaryVehicle?.registration ?? driver.vehicleRegistration ?? "",
      vehicleColor: primaryVehicle?.color ?? driver.vehicleColor ?? "",
      vehicles,
      checks: driver.checks,
      status: driver.status,
      submittedAt: driver.submittedAt.toISOString(),
      profileImageUrl: passenger?.profileImageUpdatedAt
        ? `/api/mobile/me/photo?version=${passenger.profileImageUpdatedAt.getTime()}`
        : "",
      verification,
      stats: {
        totalTrips: driverTrips.length,
        completedTrips: driverTrips.filter((trip) => trip.status === "Completed").length,
        memberSince: driver.submittedAt.toISOString(),
        yearsDriving: Math.max(
          0,
          Math.floor(
            (Date.now() - driver.submittedAt.getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        ),
        ratingAverage: reviewSummary.average,
        ratingCount: reviewSummary.count,
      },
      reviews: reviewSummary.recent,
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
      vehicleId: trip.vehicleId ?? "",
      vehicle:
        trip.vehicleMake && trip.vehicleModel
          ? `${trip.vehicleMake} ${trip.vehicleModel}${trip.vehicleYear ? ` · ${trip.vehicleYear}` : ""}`
          : "",
      vehicleRegistration: trip.vehicleRegistration ?? "",
      vehicleColor: trip.vehicleColor ?? "",
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
  vehicleRegistration: string;
  vehicleColor: string;
}) {
  const db = getDb();
  const email = input.email.trim().toLowerCase();

  const [existing] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.email, email))
    .limit(1);

  if (existing) throw new Error("DRIVER_ALREADY_EXISTS");

  const initials =
    input.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((value) => value[0])
      .join("")
      .slice(0, 4)
      .toUpperCase() || "VD";

  const result = await db.transaction(async (tx) => {
    const [driver] = await tx
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
        vehicleRegistration: input.vehicleRegistration.trim().toUpperCase(),
        vehicleColor: input.vehicleColor.trim(),
        checks: "0/2 required identity documents uploaded",
        status: "Needs info",
      })
      .returning();

    const [vehicle] = await tx
      .insert(driverVehicles)
      .values({
        driverId: driver.id,
        make: input.vehicleMake.trim(),
        model: input.vehicleModel.trim(),
        year: input.vehicleYear,
        registration: input.vehicleRegistration.trim().toUpperCase(),
        color: input.vehicleColor.trim(),
        checks: "0/2 required documents uploaded",
        status: "Needs info",
        isPrimary: true,
      })
      .returning();

    await tx.insert(activityLogs).values({
      eventType: "driver_application",
      title: "Driver application submitted",
      detail: `${driver.name} · ${driver.location}`,
      metadata: { driverId: driver.id, vehicleId: vehicle.id, email, source: "mobile" },
    });

    return { driver, vehicle };
  });

  return {
    id: result.driver.id,
    name: result.driver.name,
    email: result.driver.email ?? "",
    location: result.driver.location,
    vehicle: `${result.vehicle.make} ${result.vehicle.model} · ${result.vehicle.year}`,
    vehicleMake: result.vehicle.make,
    vehicleModel: result.vehicle.model,
    vehicleYear: result.vehicle.year,
    vehicleRegistration: result.vehicle.registration,
    vehicleColor: result.vehicle.color,
    vehicles: [{
      id: result.vehicle.id,
      make: result.vehicle.make,
      model: result.vehicle.model,
      year: result.vehicle.year,
      registration: result.vehicle.registration,
      color: result.vehicle.color,
      status: result.vehicle.status,
      checks: result.vehicle.checks,
      isPrimary: true,
      label: `${result.vehicle.make} ${result.vehicle.model} · ${result.vehicle.year}`,
      verification: {
        documents: [],
        requiredCount: 2,
        uploadedRequiredCount: 0,
        approvedRequiredCount: 0,
        missingKinds: ["vehicle_registration", "roadworthy"],
        needsAttentionKinds: [],
        readyToApprove: false,
      },
    }],
    checks: result.driver.checks,
    status: result.driver.status,
    verification: {
      documents: [],
      requiredCount: 2,
      uploadedRequiredCount: 0,
      approvedRequiredCount: 0,
      missingKinds: ["identity", "drivers_license"],
      needsAttentionKinds: [],
      readyToApprove: false,
    },
  };
}

export async function createMobileDriverVehicle(
  email: string,
  input: {
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
    vehicleRegistration: string;
    vehicleColor: string;
  }
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const [driver] = await db.select().from(drivers).where(eq(drivers.email, normalized)).limit(1);
  if (!driver) throw new Error("DRIVER_NOT_FOUND");
  if (driver.status === "Suspended" || driver.status === "Removed") throw new Error("DRIVER_BLOCKED");

  const registration = input.vehicleRegistration.trim().toUpperCase();
  const [duplicate] = await db
    .select({ id: driverVehicles.id })
    .from(driverVehicles)
    .where(and(eq(driverVehicles.driverId, driver.id), eq(driverVehicles.registration, registration)))
    .limit(1);
  if (duplicate) throw new Error("VEHICLE_ALREADY_EXISTS");

  const [vehicle] = await db
    .insert(driverVehicles)
    .values({
      driverId: driver.id,
      make: input.vehicleMake.trim(),
      model: input.vehicleModel.trim(),
      year: input.vehicleYear,
      registration,
      color: input.vehicleColor.trim(),
      status: "Needs info",
      checks: "0/2 required documents uploaded",
      isPrimary: false,
    })
    .returning();

  await db.insert(activityLogs).values({
    eventType: "driver_vehicle_added",
    title: "Driver added vehicle",
    detail: `${vehicle.make} ${vehicle.model} · ${vehicle.registration}`,
    metadata: { driverId: driver.id, vehicleId: vehicle.id, source: "mobile" },
  });

  return vehicle;
}

export async function updateMobileDriverVehicle(
  email: string,
  vehicleId: string,
  input: {
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
    vehicleRegistration: string;
    vehicleColor: string;
  }
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const [driver] = await db.select().from(drivers).where(eq(drivers.email, normalized)).limit(1);
  if (!driver) throw new Error("DRIVER_NOT_FOUND");
  if (driver.status === "Suspended" || driver.status === "Removed") throw new Error("DRIVER_BLOCKED");

  const [existing] = await db
    .select()
    .from(driverVehicles)
    .where(and(eq(driverVehicles.id, vehicleId), eq(driverVehicles.driverId, driver.id)))
    .limit(1);
  if (!existing) throw new Error("VEHICLE_NOT_FOUND");

  const registration = input.vehicleRegistration.trim().toUpperCase();
  const [updated] = await db
    .update(driverVehicles)
    .set({
      make: input.vehicleMake.trim(),
      model: input.vehicleModel.trim(),
      year: input.vehicleYear,
      registration,
      color: input.vehicleColor.trim(),
      status: "Needs info",
      checks: "Vehicle documents require verification",
      updatedAt: new Date(),
    })
    .where(eq(driverVehicles.id, vehicleId))
    .returning();

  await db
    .delete(driverDocuments)
    .where(
      and(
        eq(driverDocuments.driverId, driver.id),
        eq(driverDocuments.vehicleId, vehicleId)
      )
    );

  if (existing.isPrimary) {
    await db
      .update(drivers)
      .set({
        vehicleMake: updated.make,
        vehicleModel: updated.model,
        vehicleYear: updated.year,
        vehicleRegistration: updated.registration,
        vehicleColor: updated.color,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, driver.id));
  }

  await db.insert(activityLogs).values({
    eventType: "driver_vehicle_changed",
    title: "Driver updated vehicle",
    detail: `${updated.make} ${updated.model} · ${updated.registration}`,
    metadata: { driverId: driver.id, vehicleId, source: "mobile" },
  });

  return updated;
}

export async function setPrimaryMobileDriverVehicle(email: string, vehicleId: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const [driver] = await db.select().from(drivers).where(eq(drivers.email, normalized)).limit(1);
  if (!driver) throw new Error("DRIVER_NOT_FOUND");

  const [vehicle] = await db
    .select()
    .from(driverVehicles)
    .where(and(eq(driverVehicles.id, vehicleId), eq(driverVehicles.driverId, driver.id)))
    .limit(1);
  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");

  await db.transaction(async (tx) => {
    await tx.update(driverVehicles).set({ isPrimary: false }).where(eq(driverVehicles.driverId, driver.id));
    await tx.update(driverVehicles).set({ isPrimary: true, updatedAt: new Date() }).where(eq(driverVehicles.id, vehicleId));
    await tx.update(drivers).set({
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      vehicleRegistration: vehicle.registration,
      vehicleColor: vehicle.color,
      updatedAt: new Date(),
    }).where(eq(drivers.id, driver.id));
  });

  return vehicle;
}

export async function removeMobileDriverVehicle(email: string, vehicleId: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const [driver] = await db.select().from(drivers).where(eq(drivers.email, normalized)).limit(1);
  if (!driver) throw new Error("DRIVER_NOT_FOUND");

  const [vehicle] = await db
    .select()
    .from(driverVehicles)
    .where(and(eq(driverVehicles.id, vehicleId), eq(driverVehicles.driverId, driver.id)))
    .limit(1);
  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");

  const activeTrips = await db
    .select({ id: trips.id })
    .from(trips)
    .where(
      and(
        eq(trips.vehicleId, vehicleId),
        or(
          eq(trips.status, "Scheduled"),
          eq(trips.status, "On schedule"),
          eq(trips.status, "Boarding"),
          eq(trips.status, "Full")
        )
      )
    )
    .limit(1);
  if (activeTrips.length) throw new Error("VEHICLE_HAS_ACTIVE_TRIPS");

  await db.transaction(async (tx) => {
    await tx.delete(driverVehicles).where(eq(driverVehicles.id, vehicleId));
    if (vehicle.isPrimary) {
      const [next] = await tx
        .select()
        .from(driverVehicles)
        .where(eq(driverVehicles.driverId, driver.id))
        .limit(1);
      if (next) {
        await tx.update(driverVehicles).set({ isPrimary: true }).where(eq(driverVehicles.id, next.id));
        await tx.update(drivers).set({
          vehicleMake: next.make,
          vehicleModel: next.model,
          vehicleYear: next.year,
          vehicleRegistration: next.registration,
          vehicleColor: next.color,
          updatedAt: new Date(),
        }).where(eq(drivers.id, driver.id));
      }
    }
  });

  await db.insert(activityLogs).values({
    eventType: "driver_vehicle_removed",
    title: "Driver removed vehicle",
    detail: `${vehicle.make} ${vehicle.model} · ${vehicle.registration}`,
    metadata: { driverId: driver.id, vehicleId, source: "mobile" },
  });

  return { id: vehicleId };
}

export async function createMobileDriverTrip(
  email: string,
  input: {
    vehicleId: string;
    from: string;
    to: string;
    departureAt: Date;
    seats: number;
    fareCents: number;
  }
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [driver] = await db.select().from(drivers).where(eq(drivers.email, normalized)).limit(1);
  if (!driver) throw new Error("DRIVER_NOT_FOUND");
  if (driver.status !== "Approved") throw new Error("DRIVER_NOT_APPROVED");

  const [vehicle] = await db
    .select()
    .from(driverVehicles)
    .where(and(eq(driverVehicles.id, input.vehicleId), eq(driverVehicles.driverId, driver.id)))
    .limit(1);

  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");
  if (vehicle.status !== "Approved") throw new Error("VEHICLE_NOT_APPROVED");

  const publicId = `VY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const [trip] = await db
    .insert(trips)
    .values({
      publicId,
      fromCity: input.from.trim(),
      toCity: input.to.trim(),
      driverId: driver.id,
      vehicleId: vehicle.id,
      driverName: driver.name,
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      vehicleRegistration: vehicle.registration,
      vehicleColor: vehicle.color,
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
    metadata: { driverId: driver.id, vehicleId: vehicle.id, tripId: trip.id, publicId: trip.publicId, source: "mobile" },
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
    vehicleId: vehicle.id,
    vehicle: `${vehicle.make} ${vehicle.model} · ${vehicle.year}`,
    vehicleRegistration: vehicle.registration,
    vehicleColor: vehicle.color,
  };
}

type DriverLiveLocationInput = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  heading: number | null;
  speedMps: number | null;
  recordedAt: Date;
};

export async function updateMobileDriverLiveLocationByEmail(
  email: string,
  publicId: string,
  input: DriverLiveLocationInput
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [driver] = await db
    .select({ id: drivers.id })
    .from(drivers)
    .where(eq(drivers.email, normalized))
    .limit(1);

  if (!driver) throw new Error("DRIVER_NOT_FOUND");

  const [trip] = await db
    .select({
      id: trips.id,
      publicId: trips.publicId,
      fromCity: trips.fromCity,
      toCity: trips.toCity,
      status: trips.status,
    })
    .from(trips)
    .where(
      and(
        eq(trips.publicId, publicId),
        eq(trips.driverId, driver.id)
      )
    )
    .limit(1);

  if (!trip) throw new Error("TRIP_NOT_FOUND");
  if (trip.status !== "On schedule" && trip.status !== "Boarding") {
    throw new Error("TRIP_NOT_ACTIVE");
  }

  await db.insert(activityLogs).values({
    eventType: "driver_live_location",
    title: "Driver live location",
    detail: `${trip.publicId} · ${trip.fromCity} → ${trip.toCity}`,
    metadata: {
      driverId: driver.id,
      tripId: trip.id,
      publicId: trip.publicId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracyMeters: input.accuracyMeters,
      heading: input.heading,
      speedMps: input.speedMps,
      recordedAt: input.recordedAt.toISOString(),
      source: "mobile",
    },
  });

  return {
    latitude: input.latitude,
    longitude: input.longitude,
    accuracyMeters: input.accuracyMeters,
    heading: input.heading,
    speedMps: input.speedMps,
    recordedAt: input.recordedAt.toISOString(),
  };
}

export async function stopMobileDriverLiveLocationByEmail(
  email: string,
  publicId: string
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [driver] = await db
    .select({ id: drivers.id })
    .from(drivers)
    .where(eq(drivers.email, normalized))
    .limit(1);

  if (!driver) throw new Error("DRIVER_NOT_FOUND");

  const [trip] = await db
    .select({ id: trips.id, publicId: trips.publicId })
    .from(trips)
    .where(
      and(
        eq(trips.publicId, publicId),
        eq(trips.driverId, driver.id)
      )
    )
    .limit(1);

  if (!trip) throw new Error("TRIP_NOT_FOUND");

  await db.insert(activityLogs).values({
    eventType: "driver_live_location_stopped",
    title: "Driver stopped live location",
    detail: trip.publicId,
    metadata: {
      driverId: driver.id,
      tripId: trip.id,
      publicId: trip.publicId,
      source: "mobile",
    },
  });
}

async function getTripLiveLocation(publicId: string) {
  const db = getDb();

  const [row] = await db
    .select({
      eventType: activityLogs.eventType,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .where(
      and(
        or(
          eq(activityLogs.eventType, "driver_live_location"),
          eq(activityLogs.eventType, "driver_live_location_stopped")
        ),
        sql`${activityLogs.metadata} ->> 'publicId' = ${publicId}`
      )
    )
    .orderBy(desc(activityLogs.createdAt))
    .limit(1);

  if (!row || row.eventType === "driver_live_location_stopped") return null;

  const latitude = Number(row.metadata.latitude);
  const longitude = Number(row.metadata.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const recordedAt =
    typeof row.metadata.recordedAt === "string"
      ? row.metadata.recordedAt
      : row.createdAt.toISOString();
  const recordedTime = new Date(recordedAt).getTime();

  return {
    latitude,
    longitude,
    accuracyMeters:
      row.metadata.accuracyMeters == null
        ? null
        : Number(row.metadata.accuracyMeters),
    heading:
      row.metadata.heading == null ? null : Number(row.metadata.heading),
    speedMps:
      row.metadata.speedMps == null ? null : Number(row.metadata.speedMps),
    recordedAt,
    isFresh:
      Number.isFinite(recordedTime) &&
      Date.now() - recordedTime <= 2 * 60 * 1000,
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
  if (driver.status !== "Approved" || !(await getDriverVerificationSummary(driver.id)).readyToApprove) throw new Error("DRIVER_NOT_APPROVED");

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


export async function updateMobileDriverTripDetails(
  email: string,
  publicId: string,
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
  if (driver.status !== "Approved" || !(await getDriverVerificationSummary(driver.id)).readyToApprove) throw new Error("DRIVER_NOT_APPROVED");

  const [existing] = await db
    .select()
    .from(trips)
    .where(
      and(
        eq(trips.publicId, publicId),
        eq(trips.driverId, driver.id)
      )
    )
    .limit(1);

  if (!existing) throw new Error("TRIP_NOT_FOUND");

  if (existing.status === "Completed" || existing.status === "Cancelled") {
    throw new Error("TRIP_CLOSED");
  }

  if (existing.status === "Boarding") {
    throw new Error("TRIP_LOCKED");
  }

  if (input.seats < existing.seatsBooked) {
    throw new Error("SEAT_CAPACITY_TOO_LOW");
  }

  const [trip] = await db
    .update(trips)
    .set({
      fromCity: input.from.trim(),
      toCity: input.to.trim(),
      departureAt: input.departureAt,
      seatCapacity: input.seats,
      fareCents: input.fareCents,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(trips.publicId, publicId),
        eq(trips.driverId, driver.id)
      )
    )
    .returning();

  await db.insert(activityLogs).values({
    eventType: "driver_trip_updated",
    title: "Driver updated trip",
    detail: `${trip.publicId} · ${trip.fromCity} → ${trip.toCity}`,
    metadata: {
      driverId: driver.id,
      tripId: trip.id,
      publicId: trip.publicId,
      source: "mobile",
      departureAt: trip.departureAt.toISOString(),
      seatCapacity: trip.seatCapacity,
      fareCents: trip.fareCents,
    },
  });

  return {
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
  };
}


type MobilePrivacyPreferences = {
  profileVisible: boolean;
  sharePhone: boolean;
  locationSharing: boolean;
};

const DEFAULT_PRIVACY_PREFERENCES: MobilePrivacyPreferences = {
  profileVisible: true,
  sharePhone: false,
  locationSharing: true,
};

export async function getMobilePrivacyPreferencesByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [row] = await db
    .select({ metadata: activityLogs.metadata })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.eventType, "privacy_preferences_updated"),
        sql`lower(${activityLogs.metadata} ->> 'email') = ${normalized}`
      )
    )
    .orderBy(desc(activityLogs.createdAt))
    .limit(1);

  const metadata = row?.metadata ?? {};

  return {
    profileVisible:
      typeof metadata.profileVisible === "boolean"
        ? metadata.profileVisible
        : DEFAULT_PRIVACY_PREFERENCES.profileVisible,
    sharePhone:
      typeof metadata.sharePhone === "boolean"
        ? metadata.sharePhone
        : DEFAULT_PRIVACY_PREFERENCES.sharePhone,
    locationSharing:
      typeof metadata.locationSharing === "boolean"
        ? metadata.locationSharing
        : DEFAULT_PRIVACY_PREFERENCES.locationSharing,
  };
}

export async function updateMobilePrivacyPreferencesByEmail(
  email: string,
  input: Partial<MobilePrivacyPreferences>
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const current = await getMobilePrivacyPreferencesByEmail(normalized);
  const preferences = {
    profileVisible:
      typeof input.profileVisible === "boolean"
        ? input.profileVisible
        : current.profileVisible,
    sharePhone:
      typeof input.sharePhone === "boolean" ? input.sharePhone : current.sharePhone,
    locationSharing:
      typeof input.locationSharing === "boolean"
        ? input.locationSharing
        : current.locationSharing,
  };

  await db.insert(activityLogs).values({
    eventType: "privacy_preferences_updated",
    title: "Privacy preferences updated",
    detail: normalized,
    metadata: { email: normalized, ...preferences, source: "mobile" },
  });

  return preferences;
}

async function getMobileMessageContacts(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const passengerContacts = await db
    .select({
      email: drivers.email,
      name: drivers.name,
      tripId: trips.publicId,
      fromCity: trips.fromCity,
      toCity: trips.toCity,
    })
    .from(bookings)
    .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .innerJoin(drivers, eq(trips.driverId, drivers.id))
    .where(eq(passengers.email, normalized));

  const [driver] = await db
    .select({ id: drivers.id })
    .from(drivers)
    .where(eq(drivers.email, normalized))
    .limit(1);

  const driverContacts = driver
    ? await db
        .select({
          email: passengers.email,
          name: passengers.name,
          tripId: trips.publicId,
          fromCity: trips.fromCity,
          toCity: trips.toCity,
        })
        .from(trips)
        .innerJoin(bookings, eq(bookings.tripId, trips.id))
        .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
        .where(eq(trips.driverId, driver.id))
    : [];

  const contacts = new Map<
    string,
    { email: string; name: string; tripId: string; route: string }
  >();

  for (const contact of [...passengerContacts, ...driverContacts]) {
    if (!contact.email) continue;
    const contactEmail = contact.email.trim().toLowerCase();
    if (!contactEmail || contactEmail === normalized) continue;
    if (!contacts.has(contactEmail)) {
      contacts.set(contactEmail, {
        email: contactEmail,
        name: contact.name,
        tripId: contact.tripId,
        route: `${contact.fromCity} → ${contact.toCity}`,
      });
    }
  }

  return Array.from(contacts.values());
}

export async function getMobileMessageThreadsByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const contacts = await getMobileMessageContacts(normalized);

  const messageRows = await db
    .select({
      detail: activityLogs.detail,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.eventType, "mobile_message"),
        or(
          sql`lower(${activityLogs.metadata} ->> 'senderEmail') = ${normalized}`,
          sql`lower(${activityLogs.metadata} ->> 'recipientEmail') = ${normalized}`
        )
      )
    )
    .orderBy(desc(activityLogs.createdAt))
    .limit(250);

  const latestByEmail = new Map<
    string,
    { body: string; createdAt: Date; senderEmail: string }
  >();

  for (const row of messageRows) {
    const senderEmail =
      typeof row.metadata.senderEmail === "string"
        ? row.metadata.senderEmail.toLowerCase()
        : "";
    const recipientEmail =
      typeof row.metadata.recipientEmail === "string"
        ? row.metadata.recipientEmail.toLowerCase()
        : "";
    const otherEmail = senderEmail === normalized ? recipientEmail : senderEmail;
    if (!otherEmail || latestByEmail.has(otherEmail)) continue;
    latestByEmail.set(otherEmail, {
      body: row.detail,
      createdAt: row.createdAt,
      senderEmail,
    });
  }

  return contacts
    .map((contact) => {
      const latest = latestByEmail.get(contact.email);
      return {
        id: contact.email,
        participant: {
          name: contact.name,
          email: contact.email,
        },
        tripId: contact.tripId,
        route: contact.route,
        lastMessage: latest?.body ?? `Connected through ${contact.route}`,
        lastAt: latest?.createdAt.toISOString() ?? "",
        unread: Boolean(latest && latest.senderEmail !== normalized),
      };
    })
    .sort((a, b) => (b.lastAt || "").localeCompare(a.lastAt || ""));
}

export async function getMobileConversationByEmail(
  email: string,
  recipientEmail: string
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const recipient = recipientEmail.trim().toLowerCase();
  const contacts = await getMobileMessageContacts(normalized);
  const contact = contacts.find((item) => item.email === recipient);
  if (!contact) throw new Error("MESSAGE_CONTACT_NOT_ALLOWED");

  const rows = await db
    .select({
      detail: activityLogs.detail,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.eventType, "mobile_message"),
        or(
          and(
            sql`lower(${activityLogs.metadata} ->> 'senderEmail') = ${normalized}`,
            sql`lower(${activityLogs.metadata} ->> 'recipientEmail') = ${recipient}`
          ),
          and(
            sql`lower(${activityLogs.metadata} ->> 'senderEmail') = ${recipient}`,
            sql`lower(${activityLogs.metadata} ->> 'recipientEmail') = ${normalized}`
          )
        )
      )
    )
    .orderBy(asc(activityLogs.createdAt))
    .limit(250);

  return {
    participant: contact,
    messages: rows.map((row, index) => ({
      id: `${row.createdAt.getTime()}-${index}`,
      body: row.detail,
      senderEmail:
        typeof row.metadata.senderEmail === "string"
          ? row.metadata.senderEmail
          : "",
      sentAt: row.createdAt.toISOString(),
    })),
  };
}

export async function sendMobileMessageByEmail(
  email: string,
  input: { recipientEmail: string; body: string }
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const recipient = input.recipientEmail.trim().toLowerCase();
  const body = input.body.trim();
  if (!body) throw new Error("MESSAGE_BODY_REQUIRED");

  const contacts = await getMobileMessageContacts(normalized);
  const contact = contacts.find((item) => item.email === recipient);
  if (!contact) throw new Error("MESSAGE_CONTACT_NOT_ALLOWED");

  const [sender] = await db
    .select({ name: passengers.name })
    .from(passengers)
    .where(eq(passengers.email, normalized))
    .limit(1);

  const [message] = await db
    .insert(activityLogs)
    .values({
      eventType: "mobile_message",
      title: `Message to ${contact.name}`,
      detail: body,
      metadata: {
        senderEmail: normalized,
        senderName: sender?.name ?? normalized,
        recipientEmail: recipient,
        recipientName: contact.name,
        tripId: contact.tripId,
        route: contact.route,
        source: "mobile",
      },
    })
    .returning({ createdAt: activityLogs.createdAt });

  return {
    id: message.createdAt.getTime().toString(),
    body,
    senderEmail: normalized,
    sentAt: message.createdAt.toISOString(),
  };
}

export async function getMobileNotificationsByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const [passengerTrips, passengerPayments, driverResult] = await Promise.all([
    getPassengerTripsByEmail(normalized),
    getPassengerPaymentsByEmail(normalized),
    getMobileDriverByEmail(normalized),
  ]);

  const notifications: {
    id: string;
    kind: string;
    title: string;
    text: string;
    createdAt: string;
  }[] = [];

  for (const trip of passengerTrips.slice(0, 15)) {
    const title =
      trip.tripStatus === "Completed"
        ? "Trip completed"
        : trip.paymentStatus === "Paid"
          ? "Ride confirmed"
          : "Booking awaiting payment";
    notifications.push({
      id: `trip-${trip.id}`,
      kind: "trip",
      title,
      text: `${trip.route} · ${trip.driver}`,
      createdAt: trip.createdAt,
    });
  }

  for (const payment of passengerPayments.slice(0, 15)) {
    notifications.push({
      id: `payment-${payment.reference}`,
      kind: "payment",
      title:
        payment.status === "Settled" ? "Payment received" : `Payment ${payment.status.toLowerCase()}`,
      text: `${payment.amount} · ${payment.route}`,
      createdAt: payment.createdAt,
    });
  }

  if (driverResult?.driver) {
    notifications.push({
      id: `driver-${driverResult.driver.id}`,
      kind: "verification",
      title:
        driverResult.driver.status === "Approved"
          ? "Driver verification approved"
          : "Driver verification update",
      text: driverResult.driver.checks,
      createdAt: driverResult.driver.submittedAt ?? new Date(0).toISOString(),
    });
  }

  return notifications
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);
}

export async function getDriverEarningsByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const rows = await db
    .select({
      reference: payments.publicId,
      amountCents: payments.amountCents,
      createdAt: payments.createdAt,
      fromCity: trips.fromCity,
      toCity: trips.toCity,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .innerJoin(drivers, eq(trips.driverId, drivers.id))
    .where(
      and(eq(drivers.email, normalized), eq(payments.status, "Settled"))
    )
    .orderBy(desc(payments.createdAt));

  const now = new Date();
  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-ZA", { month: "short" }).format(date),
      amountCents: 0,
    };
  });
  const byKey = new Map(monthKeys.map((item) => [item.key, item]));

  for (const row of rows) {
    const date = row.createdAt;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.amountCents += row.amountCents;
  }

  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalCents = rows.reduce((sum, row) => sum + row.amountCents, 0);

  return {
    totalCents,
    total: money(totalCents),
    thisMonthCents: byKey.get(currentKey)?.amountCents ?? 0,
    thisMonth: money(byKey.get(currentKey)?.amountCents ?? 0),
    chart: monthKeys.map((item) => ({
      label: item.label,
      amountCents: item.amountCents,
    })),
    payouts: rows.slice(0, 20).map((row) => ({
      reference: row.reference,
      route: `${row.fromCity} → ${row.toCity}`,
      amountCents: row.amountCents,
      amount: money(row.amountCents),
      status: "Completed",
      createdAt: row.createdAt.toISOString(),
    })),
  };
}


export async function getPassengerTripExperienceByEmail(
  email: string,
  tripPublicId: string
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [row] = await db
    .select({
      bookingId: bookings.publicId,
      bookingStatus: bookings.status,
      paymentStatus: bookings.paymentStatus,
      seats: bookings.seats,
      amountCents: bookings.amountCents,
      tripId: trips.publicId,
      tripStatus: trips.status,
      fromCity: trips.fromCity,
      toCity: trips.toCity,
      departureAt: trips.departureAt,
      driverId: trips.driverId,
      driverName: trips.driverName,
      driverEmail: drivers.email,
      driverStatus: drivers.status,
      driverProfileImageUpdatedAt: sql<Date | null>`(
        select p.profile_image_updated_at
        from passengers p
        where lower(p.email) = lower(${drivers.email})
        limit 1
      )`,
      vehicleMake: trips.vehicleMake,
      vehicleModel: trips.vehicleModel,
      vehicleYear: trips.vehicleYear,
      vehicleRegistration: trips.vehicleRegistration,
      vehicleColor: trips.vehicleColor,
    })
    .from(bookings)
    .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
    .innerJoin(trips, eq(bookings.tripId, trips.id))
    .leftJoin(drivers, eq(trips.driverId, drivers.id))
    .where(
      and(
        eq(passengers.email, normalized),
        eq(trips.publicId, tripPublicId)
      )
    )
    .limit(1);

  if (!row) return null;

  const [existingReview] = await db
    .select({
      detail: activityLogs.detail,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.eventType, "driver_review"),
        sql`${activityLogs.metadata} ->> 'tripId' = ${tripPublicId}`,
        sql`lower(${activityLogs.metadata} ->> 'passengerEmail') = ${normalized}`
      )
    )
    .orderBy(desc(activityLogs.createdAt))
    .limit(1);

  const reviewedRating =
    existingReview && typeof existingReview.metadata.rating === "number"
      ? existingReview.metadata.rating
      : null;

  return {
    bookingId: row.bookingId,
    bookingStatus: row.bookingStatus,
    paymentStatus: row.paymentStatus,
    seats: row.seats,
    amountCents: row.amountCents,
    amount: money(row.amountCents),
    tripId: row.tripId,
    tripStatus: row.tripStatus,
    route: `${row.fromCity} → ${row.toCity}`,
    from: row.fromCity,
    to: row.toCity,
    departureAt: row.departureAt.toISOString(),
    driver: {
      id: row.driverId ?? "",
      name: row.driverName,
      email: row.driverEmail ?? "",
      verified: row.driverStatus === "Approved",
      profileImageUrl:
        row.driverId && row.driverProfileImageUpdatedAt
          ? `/api/public/drivers/${row.driverId}/profile-image?version=${new Date(row.driverProfileImageUpdatedAt).getTime()}`
          : "",
    },
    vehicle: {
      label:
        row.vehicleMake && row.vehicleModel
          ? `${row.vehicleMake} ${row.vehicleModel}${row.vehicleYear ? ` · ${row.vehicleYear}` : ""}`
          : "Vehicle details pending",
      registration: row.vehicleRegistration ?? "",
      color: row.vehicleColor ?? "",
    },
    review: existingReview
      ? {
          rating: reviewedRating,
          comment: existingReview.detail,
          createdAt: existingReview.createdAt.toISOString(),
        }
      : null,
  };
}

export async function submitDriverReviewByEmail(
  email: string,
  input: {
    tripId: string;
    rating: number;
    comment?: string;
  }
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const trip = await getPassengerTripExperienceByEmail(normalized, input.tripId);

  if (!trip) throw new Error("TRIP_NOT_FOUND");
  if (trip.tripStatus !== "Completed") throw new Error("TRIP_NOT_COMPLETED");
  if (!trip.driver.id) throw new Error("DRIVER_NOT_FOUND");
  if (trip.review) throw new Error("REVIEW_ALREADY_EXISTS");

  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const comment = input.comment?.trim() ?? "";

  const [review] = await db
    .insert(activityLogs)
    .values({
      eventType: "driver_review",
      title: `Driver review · ${trip.driver.name}`,
      detail: comment,
      metadata: {
        passengerEmail: normalized,
        driverId: trip.driver.id,
        tripId: trip.tripId,
        bookingId: trip.bookingId,
        rating,
        source: "mobile",
      },
    })
    .returning({ createdAt: activityLogs.createdAt });

  return {
    rating,
    comment,
    createdAt: review.createdAt.toISOString(),
  };
}

export async function getDriverReviewSummary(driverId: string) {
  const db = getDb();

  const rows = await db
    .select({
      detail: activityLogs.detail,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.eventType, "driver_review"),
        sql`${activityLogs.metadata} ->> 'driverId' = ${driverId}`
      )
    )
    .orderBy(desc(activityLogs.createdAt))
    .limit(100);

  const ratings = rows
    .map((row) =>
      typeof row.metadata.rating === "number" ? row.metadata.rating : Number(row.metadata.rating)
    )
    .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);

  const average =
    ratings.length > 0
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
      : null;

  return {
    average,
    count: ratings.length,
    recent: rows.slice(0, 5).map((row) => ({
      rating:
        typeof row.metadata.rating === "number"
          ? row.metadata.rating
          : Number(row.metadata.rating),
      comment: row.detail,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function createMobileSupportRequestByEmail(
  email: string,
  input: { subject: string; message: string }
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [passenger] = await db
    .select({ id: passengers.id, name: passengers.name })
    .from(passengers)
    .where(eq(passengers.email, normalized))
    .limit(1);

  if (!passenger) throw new Error("PASSENGER_NOT_FOUND");

  const reference = `SUP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  await db.insert(activityLogs).values({
    eventType: "mobile_support_request",
    title: input.subject.trim(),
    detail: input.message.trim(),
    metadata: {
      reference,
      passengerId: passenger.id,
      passengerName: passenger.name,
      email: normalized,
      status: "Open",
      source: "mobile",
    },
  });

  return {
    reference,
    status: "Open",
    subject: input.subject.trim(),
  };
}
