import { getPassengerDetails, removePassenger, updatePassenger } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statuses = new Set(["Active", "Review", "Suspended", "Removed"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { id } = await params;
  try {
    const data = await getPassengerDetails(id);
    if (!data) return Response.json({ error: "Passenger not found" }, { status: 404 });
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Passenger detail load failed", error);
    return Response.json({ error: "Unable to load passenger" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const update: { name?: string; email?: string; phone?: string | null; city?: string; status?: string } = {};
  if (typeof body?.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body?.email === "string" && /^\S+@\S+\.\S+$/.test(body.email.trim())) update.email = body.email.trim().toLowerCase();
  if (typeof body?.phone === "string") update.phone = body.phone.trim() || null;
  if (typeof body?.city === "string" && body.city.trim()) update.city = body.city.trim();
  if (typeof body?.status === "string" && statuses.has(body.status)) update.status = body.status;

  if (!Object.keys(update).length) return Response.json({ error: "No valid passenger updates supplied" }, { status: 400 });

  try {
    const passenger = await updatePassenger(id, update);
    if (!passenger) return Response.json({ error: "Passenger not found" }, { status: 404 });
    return Response.json({ passenger });
  } catch (error) {
    console.error("Passenger update failed", error);
    return Response.json({ error: "Unable to update passenger" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { id } = await params;
  try {
    const passenger = await removePassenger(id);
    if (!passenger) return Response.json({ error: "Passenger not found" }, { status: 404 });
    return Response.json({ removed: true, passengerId: passenger.id });
  } catch (error) {
    console.error("Passenger removal failed", error);
    return Response.json({ error: "Unable to remove passenger" }, { status: 500 });
  }
}
