import { isDatabaseConfigured } from "@/lib/db";
import {
  createPublicBooking,
  getPassengerAccountByEmail,
} from "@/lib/db/public";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await getPassengerSession(getMobileSessionCookie(request));

  if (auth.status === "unconfigured") {
    return Response.json({ error: "Passenger authentication is not configured" }, { status: 503 });
  }

  if (auth.status !== "authenticated" || !auth.user.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const tripId = typeof body?.tripId === "string" ? body.tripId.trim() : "";
  const seats = Number(body?.seats ?? 1);

  if (!tripId || !Number.isInteger(seats) || seats < 1 || seats > 8) {
    return Response.json({ error: "Valid trip and seat count are required" }, { status: 400 });
  }

  const passenger = await getPassengerAccountByEmail(auth.user.email);

  if (!passenger) {
    return Response.json(
      { error: "Complete your passenger profile before booking" },
      { status: 409 }
    );
  }

  try {
    const booking = await createPublicBooking({
      tripId,
      seats,
      passenger: {
        name: passenger.name,
        email: passenger.email,
        city: passenger.city,
      },
    });

    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "TRIP_UNAVAILABLE") {
      return Response.json(
        { error: "This trip no longer has enough seats available" },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "PASSENGER_BLOCKED") {
      return Response.json(
        { error: "This passenger account cannot create bookings" },
        { status: 403 }
      );
    }

    console.error("Authenticated booking creation failed", error);
    return Response.json({ error: "Unable to create booking" }, { status: 500 });
  }
}
