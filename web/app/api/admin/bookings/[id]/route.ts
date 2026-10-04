import { getBookingDetails, updateBooking } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statuses = new Set(["Awaiting payment", "Confirmed", "Completed", "Cancelled"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { id } = await params;
  try {
    const data = await getBookingDetails(id);
    if (!data) return Response.json({ error: "Booking not found" }, { status: 404 });
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Booking detail load failed", error);
    return Response.json({ error: "Unable to load booking" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const update: { seats?: number; amountCents?: number; status?: string } = {};
  if (body?.seats !== undefined) {
    const seats = Number(body.seats);
    if (!Number.isInteger(seats) || seats < 1 || seats > 8) return Response.json({ error: "Invalid seat count" }, { status: 400 });
    update.seats = seats;
  }
  if (body?.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0) return Response.json({ error: "Invalid amount" }, { status: 400 });
    update.amountCents = Math.round(amount * 100);
  }
  if (typeof body?.status === "string" && statuses.has(body.status)) update.status = body.status;

  if (!Object.keys(update).length) return Response.json({ error: "No valid booking updates supplied" }, { status: 400 });

  try {
    const booking = await updateBooking(id, update);
    if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
    return Response.json({ booking });
  } catch (error) {
    console.error("Booking update failed", error);
    return Response.json({ error: "Unable to update booking" }, { status: 500 });
  }
}
