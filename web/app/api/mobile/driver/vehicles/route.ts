import { isDatabaseConfigured } from "@/lib/db";
import {
  createMobileDriverVehicle,
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
  return { email: auth.user.email };
}

function vehicleInput(body: any) {
  return {
    vehicleMake: typeof body?.vehicleMake === "string" ? body.vehicleMake.trim() : "",
    vehicleModel: typeof body?.vehicleModel === "string" ? body.vehicleModel.trim() : "",
    vehicleYear: Number(body?.vehicleYear),
    vehicleRegistration: typeof body?.vehicleRegistration === "string" ? body.vehicleRegistration.trim() : "",
    vehicleColor: typeof body?.vehicleColor === "string" ? body.vehicleColor.trim() : "",
  };
}

function validVehicle(input: ReturnType<typeof vehicleInput>) {
  return (
    input.vehicleMake.length >= 2 &&
    input.vehicleModel.length >= 1 &&
    input.vehicleRegistration.length >= 2 &&
    input.vehicleColor.length >= 2 &&
    Number.isInteger(input.vehicleYear) &&
    input.vehicleYear >= 1980 &&
    input.vehicleYear <= 2100
  );
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }
  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;
  const data = await getMobileDriverByEmail(auth.email);
  if (!data) return Response.json({ error: "Driver profile not found" }, { status: 404 });
  return Response.json({ vehicles: data.driver.vehicles ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }
  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;

  const input = vehicleInput(await request.json().catch(() => null));
  if (!validVehicle(input)) {
    return Response.json({ error: "Complete all required vehicle details" }, { status: 400 });
  }

  try {
    const vehicle = await createMobileDriverVehicle(auth.email, input);
    return Response.json({ vehicle }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "DRIVER_NOT_FOUND") {
      return Response.json({ error: "Driver profile not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "DRIVER_BLOCKED") {
      return Response.json({ error: "This driver account cannot add vehicles" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "VEHICLE_ALREADY_EXISTS") {
      return Response.json({ error: "A vehicle with this registration already exists" }, { status: 409 });
    }
    console.error("Driver vehicle create failed", error);
    return Response.json({ error: "Unable to add vehicle" }, { status: 500 });
  }
}
