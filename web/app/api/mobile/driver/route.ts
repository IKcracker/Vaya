import { isDatabaseConfigured } from "@/lib/db";
import {
  createMobileDriverApplication,
  getMobileDriverByEmail,
} from "@/lib/db/public";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authEmail(request: Request) {
  const auth = await getPassengerSession(getMobileSessionCookie(request));

  if (auth.status === "unconfigured") {
    return { error: Response.json({ error: "Passenger authentication is not configured" }, { status: 503 }) };
  }

  if (auth.status !== "authenticated" || !auth.user.email) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { email: auth.user.email, name: auth.user.name ?? "" };
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;

  const data = await getMobileDriverByEmail(auth.email);

  return Response.json(
    { driver: data?.driver ?? null, trips: data?.trips ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const name =
    typeof body?.name === "string" && body.name.trim()
      ? body.name.trim()
      : auth.name.trim();
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const location =
    typeof body?.location === "string" ? body.location.trim() : "";
  const vehicleMake =
    typeof body?.vehicleMake === "string" ? body.vehicleMake.trim() : "";
  const vehicleModel =
    typeof body?.vehicleModel === "string" ? body.vehicleModel.trim() : "";
  const vehicleYear = Number(body?.vehicleYear);

  if (
    name.length < 2 ||
    location.length < 2 ||
    vehicleMake.length < 2 ||
    vehicleModel.length < 1 ||
    !Number.isInteger(vehicleYear) ||
    vehicleYear < 1980 ||
    vehicleYear > 2100
  ) {
    return Response.json({ error: "Complete all required driver and vehicle details" }, { status: 400 });
  }

  try {
    const driver = await createMobileDriverApplication({
      name,
      email: auth.email,
      phone,
      location,
      vehicleMake,
      vehicleModel,
      vehicleYear,
    });

    return Response.json({ driver }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "DRIVER_ALREADY_EXISTS") {
      return Response.json({ error: "A driver profile already exists for this account" }, { status: 409 });
    }

    console.error("Mobile driver application failed", error);
    return Response.json({ error: "Unable to submit driver application" }, { status: 500 });
  }
}
