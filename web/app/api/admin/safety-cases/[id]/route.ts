import { getSafetyCaseDetails, updateSafetyCase } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const priorities = new Set(["Low", "Medium", "High"]);
const statuses = new Set(["Open", "Investigating", "Waiting", "Resolved", "Closed"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { id } = await params;
  try {
    const data = await getSafetyCaseDetails(id);
    if (!data) return Response.json({ error: "Safety case not found" }, { status: 404 });
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Safety case detail load failed", error);
    return Response.json({ error: "Unable to load safety case" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const update: { subject?: string; priority?: string; owner?: string; note?: string | null; status?: string } = {};
  if (typeof body?.subject === "string" && body.subject.trim()) update.subject = body.subject.trim();
  if (typeof body?.priority === "string" && priorities.has(body.priority)) update.priority = body.priority;
  if (typeof body?.owner === "string") update.owner = body.owner.trim() || "Unassigned";
  if (typeof body?.note === "string") update.note = body.note.trim() || null;
  if (typeof body?.status === "string" && statuses.has(body.status)) update.status = body.status;

  if (!Object.keys(update).length) return Response.json({ error: "No valid safety case updates supplied" }, { status: 400 });

  try {
    const safetyCase = await updateSafetyCase(id, update);
    if (!safetyCase) return Response.json({ error: "Safety case not found" }, { status: 404 });
    return Response.json({ safetyCase });
  } catch (error) {
    console.error("Safety case update failed", error);
    return Response.json({ error: "Unable to update safety case" }, { status: 500 });
  }
}
