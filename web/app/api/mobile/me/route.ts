import { isDatabaseConfigured } from "@/lib/db";
import {
  getPassengerAccountByEmail,
  updatePassengerAccountByEmail,
} from "@/lib/db/public";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  const passenger = await getPassengerAccountByEmail(auth.user.email);

  return Response.json(
    {
      user: auth.user,
      passenger,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}


export async function PATCH(request: Request) {
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
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";

  if (name.length < 2 || city.length < 2) {
    return Response.json({ error: "Name and home city are required" }, { status: 400 });
  }

  if (phone.length > 40 || name.length > 160 || city.length > 120) {
    return Response.json({ error: "Profile details are too long" }, { status: 400 });
  }

  const passenger = await updatePassengerAccountByEmail(auth.user.email, {
    name,
    phone,
    city,
  });

  if (!passenger) {
    return Response.json({ error: "Passenger profile not found" }, { status: 404 });
  }

  return Response.json({ user: auth.user, passenger });
}
