import { updateDriverStatus } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";

const allowedStatuses = new Set(["Review", "Ready", "Needs info", "Approved", "Rejected"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status.trim() : "";

  if (!allowedStatuses.has(status)) {
    return Response.json({ error: "Invalid driver status" }, { status: 400 });
  }

  try {
    const driver = await updateDriverStatus(id, status);
    if (!driver) {
      return Response.json({ error: "Driver not found" }, { status: 404 });
    }
    return Response.json({ driver });
  } catch (error) {
    console.error("Driver update failed", error);
    return Response.json({ error: "Unable to update driver" }, { status: 500 });
  }
}
