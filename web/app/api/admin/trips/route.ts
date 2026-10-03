import { createTrip } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const from = typeof body?.from === "string" ? body.from.trim() : "";
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  const driver = typeof body?.driver === "string" ? body.driver.trim() : "";
  const date = typeof body?.date === "string" ? body.date.trim() : "";
  const departure = typeof body?.departure === "string" ? body.departure.trim() : "";
  const seats = Number(body?.seats);
  const fare = Number(body?.fare);

  if (
    !from ||
    !to ||
    !driver ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}$/.test(departure) ||
    !Number.isInteger(seats) ||
    seats < 1 ||
    seats > 8 ||
    !Number.isFinite(fare) ||
    fare <= 0
  ) {
    return Response.json({ error: "Invalid trip details" }, { status: 400 });
  }

  try {
    const trip = await createTrip({
      from,
      to,
      driver,
      date,
      departure,
      seats,
      fareCents: Math.round(fare * 100),
    });
    return Response.json({ trip }, { status: 201 });
  } catch (error) {
    console.error("Trip creation failed", error);
    return Response.json({ error: "Unable to create trip" }, { status: 500 });
  }
}
