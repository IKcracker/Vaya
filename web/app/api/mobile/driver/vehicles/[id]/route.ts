import { isDatabaseConfigured } from "@/lib/db";
import {
  removeMobileDriverVehicle,
  setPrimaryMobileDriverVehicle,
  updateMobileDriverVehicle,
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }
  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  try {
    if (body?.action === "set_primary") {
      const vehicle = await setPrimaryMobileDriverVehicle(auth.email, id);
      return Response.json({ vehicle });
    }

    const input = {
      vehicleMake: typeof body?.vehicleMake === "string" ? body.vehicleMake.trim() : "",
      vehicleModel: typeof body?.vehicleModel === "string" ? body.vehicleModel.trim() : "",
      vehicleYear: Number(body?.vehicleYear),
      vehicleRegistration: typeof body?.vehicleRegistration === "string" ? body.vehicleRegistration.trim() : "",
      vehicleColor: typeof body?.vehicleColor === "string" ? body.vehicleColor.trim() : "",
    };

    if (
      input.vehicleMake.length < 2 ||
      input.vehicleModel.length < 1 ||
      input.vehicleRegistration.length < 2 ||
      input.vehicleColor.length < 2 ||
      !Number.isInteger(input.vehicleYear) ||
      input.vehicleYear < 1980 ||
      input.vehicleYear > 2100
    ) {
      return Response.json({ error: "Complete all required vehicle details" }, { status: 400 });
    }

    const vehicle = await updateMobileDriverVehicle(auth.email, id, input);
    return Response.json({ vehicle });
  } catch (error) {
    if (error instanceof Error && (error.message === "DRIVER_NOT_FOUND" || error.message === "VEHICLE_NOT_FOUND")) {
      return Response.json({ error: error.message === "VEHICLE_NOT_FOUND" ? "Vehicle not found" : "Driver profile not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "DRIVER_BLOCKED") {
      return Response.json({ error: "This driver account cannot update vehicles" }, { status: 403 });
    }
    console.error("Driver vehicle update failed", error);
    return Response.json({ error: "Unable to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }
  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  try {
    await removeMobileDriverVehicle(auth.email, id);
    return Response.json({ removed: true });
  } catch (error) {
    if (error instanceof Error && error.message === "VEHICLE_HAS_ACTIVE_TRIPS") {
      return Response.json({ error: "This vehicle is assigned to an active trip and cannot be removed yet" }, { status: 409 });
    }
    if (error instanceof Error && (error.message === "DRIVER_NOT_FOUND" || error.message === "VEHICLE_NOT_FOUND")) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 });
    }
    console.error("Driver vehicle removal failed", error);
    return Response.json({ error: "Unable to remove vehicle" }, { status: 500 });
  }
}
