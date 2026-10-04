import { isDatabaseConfigured } from "@/lib/db";
import { createPublicBooking } from "@/lib/db/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const tripId = typeof body?.tripId === "string" ? body.tripId.trim() : "";
  const seats = Number(body?.seats ?? 1);
  const name = typeof body?.passenger?.name === "string" ? body.passenger.name.trim() : "";
  const email = typeof body?.passenger?.email === "string" ? body.passenger.email.trim().toLowerCase() : "";
  const city = typeof body?.passenger?.city === "string" ? body.passenger.city.trim() : "";

  if (!tripId || !name || !city || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Trip and passenger details are required" }, { status: 400 });
  }

  if (!Number.isInteger(seats) || seats < 1 || seats > 8) {
    return Response.json({ error: "Invalid seat count" }, { status: 400 });
  }

  try {
    const booking = await createPublicBooking({
      tripId,
      seats,
      passenger: { name, email, city },
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

    console.error("Public booking creation failed", error);
    return Response.json({ error: "Unable to create booking" }, { status: 500 });
  }
}
