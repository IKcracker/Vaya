import { isDatabaseConfigured } from "@/lib/db";
import { updateMobileDriverTripStatus } from "@/lib/db/public";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedStatuses = new Set([
  "Scheduled",
  "On schedule",
  "Boarding",
  "Completed",
  "Cancelled",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await getPassengerSession(getMobileSessionCookie(request));

  if (auth.status === "unconfigured") {
    return Response.json({ error: "Passenger authentication is not configured" }, { status: 503 });
  }

  if (auth.status !== "authenticated" || !auth.user.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status.trim() : "";

  if (!allowedStatuses.has(status)) {
    return Response.json({ error: "Invalid trip status" }, { status: 400 });
  }

  try {
    const trip = await updateMobileDriverTripStatus(
      auth.user.email,
      id,
      status as "Scheduled" | "On schedule" | "Boarding" | "Completed" | "Cancelled"
    );

    return Response.json({ trip });
  } catch (error) {
    if (error instanceof Error && error.message === "DRIVER_NOT_FOUND") {
      return Response.json({ error: "Driver profile not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "DRIVER_NOT_APPROVED") {
      return Response.json({ error: "Driver profile is not approved" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "TRIP_NOT_FOUND") {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }

    console.error("Driver trip status update failed", error);
    return Response.json({ error: "Unable to update trip" }, { status: 500 });
  }
}
