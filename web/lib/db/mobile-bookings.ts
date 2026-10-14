import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "./index";
import { withDbTransaction } from "./transaction";
import { activityLogs, bookings, drivers, passengers, payments, trips } from "./schema";

export async function getDriverTripPassengers(email: string, publicId: string) {
  const db = getDb();
  const [trip] = await db.select({ id: trips.id }).from(trips)
    .innerJoin(drivers, eq(trips.driverId, drivers.id))
    .where(and(eq(trips.publicId, publicId), eq(drivers.email, email.trim().toLowerCase())))
    .limit(1);
  if (!trip) return null;

  return db.select({
    id: bookings.publicId,
    name: passengers.name,
    email: passengers.email,
    seats: bookings.seats,
    status: bookings.status,
    paymentStatus: bookings.paymentStatus,
  }).from(bookings)
    .innerJoin(passengers, eq(bookings.passengerId, passengers.id))
    .where(eq(bookings.tripId, trip.id))
    .orderBy(asc(bookings.createdAt));
}

// Only reservations that have never entered checkout can be released here.
// A hosted checkout may still settle later, even after the app is closed.
export async function cancelUnpaidBooking(email: string, publicId: string) {
  return withDbTransaction(async (tx) => {
    const [owned] = await tx.select({ id: bookings.id, tripId: bookings.tripId })
      .from(bookings).innerJoin(passengers, eq(bookings.passengerId, passengers.id))
      .where(and(eq(bookings.publicId, publicId), eq(passengers.email, email.trim().toLowerCase())))
      .limit(1);
    if (!owned) throw new Error("BOOKING_NOT_FOUND");

    // Match the trip -> booking lock order used by driver lifecycle updates.
    const [trip] = await tx.select().from(trips).where(eq(trips.id, owned.tripId))
      .for("update");
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, owned.id))
      .for("update");
    if (!trip || !booking) throw new Error("BOOKING_NOT_FOUND");
    if (booking.status === "Cancelled") return { id: publicId, status: "Cancelled" };
    if (trip.departureAt.getTime() <= Date.now() ||
        !["Scheduled", "On schedule", "Full"].includes(trip.status) ||
        booking.status !== "Awaiting payment" || booking.paymentStatus !== "Pending") {
      throw new Error("BOOKING_CANNOT_CANCEL");
    }
    const attempts = await tx.select({ id: payments.id }).from(payments)
      .where(eq(payments.bookingId, booking.id)).limit(1);
    if (attempts.length) throw new Error("BOOKING_CHECKOUT_STARTED");

    await tx.update(bookings).set({ status: "Cancelled", updatedAt: new Date() })
      .where(eq(bookings.id, booking.id));
    await tx.update(trips).set({
      seatsBooked: sql`greatest(0, ${trips.seatsBooked} - ${booking.seats})`,
      status: trip.status === "Full" ? "Scheduled" : trip.status,
      updatedAt: new Date(),
    }).where(eq(trips.id, trip.id));
    await tx.insert(activityLogs).values({
      eventType: "passenger_booking_cancelled",
      title: "Passenger released unpaid reservation",
      detail: `${publicId} · ${booking.seats} seats released`,
      metadata: { bookingId: booking.id, tripId: trip.id, source: "mobile" },
    });
    return { id: publicId, status: "Cancelled" };
  });
}
