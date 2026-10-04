import { isDatabaseConfigured } from "@/lib/db";
import {
  createMobileDriverTrip,
  getMobileDriverByEmail,
} from "@/lib/db/public";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authenticatedEmail(request: Request) {
  const auth = await getPassengerSession(getMobileSessionCookie(request));

  if (auth.status === "unconfigured") {
    return { response: Response.json({ error: "Passenger authentication is not configured" }, { status: 503 }) };
  }

  if (auth.status !== "authenticated" || !auth.user.email) {
    return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { email: auth.user.email };
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authenticatedEmail(request);
  if ("response" in auth) return auth.response;

  const data = await getMobileDriverByEmail(auth.email);

  if (!data) {
    return Response.json({ error: "Driver profile not found" }, { status: 404 });
  }

  return Response.json(
    { driver: data.driver, trips: data.trips },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authenticatedEmail(request);
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const from = typeof body?.from === "string" ? body.from.trim() : "";
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  const departureAt = new Date(
    typeof body?.departureAt === "string" ? body.departureAt : ""
  );
  const seats = Number(body?.seats);
  const fare = Number(body?.fare);

  if (
    !from ||
    !to ||
    from.toLowerCase() === to.toLowerCase() ||
    Number.isNaN(departureAt.getTime()) ||
    departureAt.getTime() <= Date.now() ||
    !Number.isInteger(seats) ||
    seats < 1 ||
    seats > 8 ||
    !Number.isFinite(fare) ||
    fare <= 0 ||
    fare > 10000
  ) {
    return Response.json({ error: "Invalid trip details" }, { status: 400 });
  }

  try {
    const trip = await createMobileDriverTrip(auth.email, {
      from,
      to,
      departureAt,
      seats,
      fareCents: Math.round(fare * 100),
    });

    return Response.json({ trip }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "DRIVER_NOT_FOUND") {
      return Response.json({ error: "Driver profile not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "DRIVER_NOT_APPROVED") {
      return Response.json({ error: "Your driver profile must be approved before publishing trips" }, { status: 403 });
    }

    console.error("Mobile driver trip creation failed", error);
    return Response.json({ error: "Unable to publish trip" }, { status: 500 });
  }
}
