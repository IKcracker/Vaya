import { getTripDetails, updateTrip } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statuses = new Set(["Scheduled", "On schedule", "Boarding", "Full", "Completed", "Cancelled", "Suspended", "Driver review"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { id } = await params;
  try {
    const data = await getTripDetails(id);
    if (!data) return Response.json({ error: "Trip not found" }, { status: 404 });
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Trip detail load failed", error);
    return Response.json({ error: "Unable to load trip" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const update: {
    fromCity?: string;
    toCity?: string;
    driverName?: string;
    departureAt?: Date;
    seatCapacity?: number;
    fareCents?: number;
    status?: string;
  } = {};

  if (typeof body?.fromCity === "string" && body.fromCity.trim()) update.fromCity = body.fromCity.trim();
  if (typeof body?.toCity === "string" && body.toCity.trim()) update.toCity = body.toCity.trim();
  if (typeof body?.driverName === "string" && body.driverName.trim()) update.driverName = body.driverName.trim();
  if (typeof body?.status === "string" && statuses.has(body.status)) update.status = body.status;
  if (body?.seatCapacity !== undefined) {
    const seats = Number(body.seatCapacity);
    if (!Number.isInteger(seats) || seats < 1 || seats > 8) return Response.json({ error: "Invalid seat capacity" }, { status: 400 });
    update.seatCapacity = seats;
  }
  if (body?.fare !== undefined) {
    const fare = Number(body.fare);
    if (!Number.isFinite(fare) || fare <= 0) return Response.json({ error: "Invalid fare" }, { status: 400 });
    update.fareCents = Math.round(fare * 100);
  }
  if (typeof body?.departureAt === "string") {
    const departureAt = new Date(body.departureAt);
    if (Number.isNaN(departureAt.getTime())) return Response.json({ error: "Invalid departure date" }, { status: 400 });
    update.departureAt = departureAt;
  }

  if (!Object.keys(update).length) return Response.json({ error: "No valid trip updates supplied" }, { status: 400 });

  try {
    const trip = await updateTrip(id, update);
    if (!trip) return Response.json({ error: "Trip not found" }, { status: 404 });
    return Response.json({ trip });
  } catch (error) {
    console.error("Trip update failed", error);
    return Response.json({ error: "Unable to update trip" }, { status: 500 });
  }
}
