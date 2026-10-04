import { createSafetyCase } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";

const priorities = new Set(["Low", "Medium", "High"]);

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const trip = typeof body?.trip === "string" ? body.trip.trim() : "";
  const priority = typeof body?.priority === "string" ? body.priority.trim() : "Medium";
  const owner = typeof body?.owner === "string" ? body.owner.trim() : "Unassigned";
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  if (!subject || !trip || !priorities.has(priority)) {
    return Response.json({ error: "Invalid safety case details" }, { status: 400 });
  }

  try {
    const item = await createSafetyCase({ subject, trip, priority, owner, note });
    return Response.json({ safetyCase: item }, { status: 201 });
  } catch (error) {
    console.error("Safety case creation failed", error);
    return Response.json({ error: "Unable to create safety case" }, { status: 500 });
  }
}
