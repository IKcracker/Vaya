import type { PassengerTrip } from "./auth";

export function parseSeatCount(value: unknown): number | null {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const seats = Number(value);
  return Number.isInteger(seats) && seats >= 1 && seats <= 8 ? seats : null;
}

export function isUpcomingBooking(trip: PassengerTrip, now: number) {
  if (["Cancelled", "Completed"].includes(trip.bookingStatus) ||
      ["Cancelled", "Completed"].includes(trip.tripStatus)) return false;
  // Active journeys remain reachable after their scheduled departure time.
  return ["Boarding", "On schedule"].includes(trip.tripStatus) ||
    new Date(trip.departureAt).getTime() >= now;
}

export function canReleaseReservation(booking: {
  status: string;
  paymentStatus: string;
  payments: unknown[];
  trip: { departureAt: string; status: string };
}, now: number) {
  return booking.status === "Awaiting payment" && booking.paymentStatus === "Pending" &&
    ["Scheduled", "On schedule", "Full"].includes(booking.trip.status) &&
    booking.payments.length === 0 && new Date(booking.trip.departureAt).getTime() > now;
}
