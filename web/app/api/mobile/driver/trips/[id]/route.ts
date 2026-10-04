import { isDatabaseConfigured } from "@/lib/db";
import {
  updateMobileDriverTripDetails,
  updateMobileDriverTripStatus,
} from "@/lib/db/public";
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

  try {
    if (body?.action === "update_details") {
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

      const trip = await updateMobileDriverTripDetails(auth.user.email, id, {
        from,
        to,
        departureAt,
        seats,
        fareCents: Math.round(fare * 100),
      });

      return Response.json({ trip });
    }

    const status = typeof body?.status === "string" ? body.status.trim() : "";

    if (!allowedStatuses.has(status)) {
      return Response.json({ error: "Invalid trip status" }, { status: 400 });
    }

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

    if (error instanceof Error && error.message === "TRIP_CLOSED") {
      return Response.json(
        { error: "Completed or cancelled trips can no longer be edited" },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "TRIP_LOCKED") {
      return Response.json(
        { error: "Trip details are locked once boarding starts" },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "SEAT_CAPACITY_TOO_LOW") {
      return Response.json(
        { error: "Seat capacity cannot be lower than seats already booked" },
        { status: 409 }
      );
    }

    console.error("Driver trip update failed", error);
    return Response.json({ error: "Unable to update trip" }, { status: 500 });
  }
}
