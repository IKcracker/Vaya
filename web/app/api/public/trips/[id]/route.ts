import { isDatabaseConfigured } from "@/lib/db";
import { getPublicTrip } from "@/lib/db/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const { id } = await params;

  try {
    const trip = await getPublicTrip(id);

    if (!trip) {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }

    return Response.json(
      { trip },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Public trip load failed", error);
    return Response.json({ error: "Unable to load trip" }, { status: 500 });
  }
}
