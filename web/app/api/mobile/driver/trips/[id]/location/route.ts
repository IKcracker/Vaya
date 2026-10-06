import { isDatabaseConfigured } from "@/lib/db";
import {
  stopMobileDriverLiveLocationByEmail,
  updateMobileDriverLiveLocationByEmail,
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
    return {
      response: Response.json(
        { error: "Passenger authentication is not configured" },
        { status: 503 }
      ),
    };
  }

  if (auth.status !== "authenticated" || !auth.user.email) {
    return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { email: auth.user.email };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authenticatedEmail(request);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  const accuracyMeters =
    body?.accuracyMeters == null ? null : Number(body.accuracyMeters);
  const heading =
    body?.heading == null ? null : Number(body.heading);
  const speedMps =
    body?.speedMps == null ? null : Number(body.speedMps);
  const recordedAt =
    typeof body?.recordedAt === "string" ? new Date(body.recordedAt) : new Date();

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    (accuracyMeters != null && (!Number.isFinite(accuracyMeters) || accuracyMeters < 0)) ||
    (heading != null && (!Number.isFinite(heading) || heading < 0 || heading > 360)) ||
    (speedMps != null && (!Number.isFinite(speedMps) || speedMps < 0 || speedMps > 100)) ||
    Number.isNaN(recordedAt.getTime())
  ) {
    return Response.json({ error: "Invalid location update" }, { status: 400 });
  }

  const now = Date.now();
  if (recordedAt.getTime() < now - 10 * 60 * 1000 || recordedAt.getTime() > now + 2 * 60 * 1000) {
    return Response.json({ error: "Location timestamp is outside the allowed window" }, { status: 400 });
  }

  try {
    const location = await updateMobileDriverLiveLocationByEmail(auth.email, id, {
      latitude,
      longitude,
      accuracyMeters,
      heading,
      speedMps,
      recordedAt,
    });

    return Response.json(
      { location },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "DRIVER_NOT_FOUND") {
      return Response.json({ error: "Driver profile not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "TRIP_NOT_FOUND") {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "TRIP_NOT_ACTIVE") {
      return Response.json(
        { error: "Set the trip to On schedule or Boarding before sharing live location" },
        { status: 409 }
      );
    }

    console.error("Driver live location update failed", error);
    return Response.json({ error: "Unable to update live location" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authenticatedEmail(request);
  if ("response" in auth) return auth.response;

  const { id } = await params;

  try {
    await stopMobileDriverLiveLocationByEmail(auth.email, id);
    return Response.json({ stopped: true });
  } catch (error) {
    if (error instanceof Error && error.message === "DRIVER_NOT_FOUND") {
      return Response.json({ error: "Driver profile not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "TRIP_NOT_FOUND") {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }

    console.error("Driver live location stop failed", error);
    return Response.json({ error: "Unable to stop live location" }, { status: 500 });
  }
}
