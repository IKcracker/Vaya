import {
  getDriverDetails,
  removeDriver,
  updateDriver,
} from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedStatuses = new Set([
  "Review",
  "Ready",
  "Needs info",
  "Approved",
  "Rejected",
  "Suspended",
  "Removed",
]);

function cleanOptionalString(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const { id } = await params;

  try {
    const data = await getDriverDetails(id);
    if (!data) {
      return Response.json({ error: "Driver not found" }, { status: 404 });
    }
    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Driver detail load failed", error);
    return Response.json({ error: "Unable to load driver" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const name = cleanOptionalString(body?.name);
  const email = cleanOptionalString(body?.email);
  const phone = cleanOptionalString(body?.phone);
  const location = cleanOptionalString(body?.location);
  const vehicleMake = cleanOptionalString(body?.vehicleMake);
  const vehicleModel = cleanOptionalString(body?.vehicleModel);
  const checks = cleanOptionalString(body?.checks);
  const status = cleanOptionalString(body?.status);
  const vehicleYear =
    body?.vehicleYear === undefined ? undefined : Number(body.vehicleYear);

  if (status !== undefined && status !== null && !allowedStatuses.has(status)) {
    return Response.json({ error: "Invalid driver status" }, { status: 400 });
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (
    vehicleYear !== undefined &&
    (!Number.isInteger(vehicleYear) || vehicleYear < 1980 || vehicleYear > 2100)
  ) {
    return Response.json({ error: "Invalid vehicle year" }, { status: 400 });
  }

  const update = {
    ...(name !== undefined && name !== null ? { name } : {}),
    ...(email !== undefined ? { email: email || null } : {}),
    ...(phone !== undefined ? { phone: phone || null } : {}),
    ...(location !== undefined && location !== null ? { location } : {}),
    ...(vehicleMake !== undefined && vehicleMake !== null ? { vehicleMake } : {}),
    ...(vehicleModel !== undefined && vehicleModel !== null ? { vehicleModel } : {}),
    ...(vehicleYear !== undefined ? { vehicleYear } : {}),
    ...(checks !== undefined && checks !== null ? { checks } : {}),
    ...(status !== undefined && status !== null ? { status } : {}),
  };

  if (!Object.keys(update).length) {
    return Response.json({ error: "No valid driver updates supplied" }, { status: 400 });
  }

  try {
    const driver = await updateDriver(id, update);
    if (!driver) {
      return Response.json({ error: "Driver not found" }, { status: 404 });
    }
    return Response.json({ driver });
  } catch (error) {
    console.error("Driver update failed", error);
    return Response.json({ error: "Unable to update driver" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const { id } = await params;

  try {
    const driver = await removeDriver(id);
    if (!driver) {
      return Response.json({ error: "Driver not found" }, { status: 404 });
    }
    return Response.json({ removed: true, driverId: driver.id });
  } catch (error) {
    console.error("Driver removal failed", error);
    return Response.json({ error: "Unable to remove driver" }, { status: 500 });
  }
}
