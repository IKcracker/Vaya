import { isDatabaseConfigured } from "@/lib/db";
import { searchPublicTrips } from "@/lib/db/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const passengers = Number(url.searchParams.get("passengers") ?? "1");

  try {
    const trips = await searchPublicTrips({
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      date: url.searchParams.get("date") ?? undefined,
      passengers: Number.isFinite(passengers) ? passengers : 1,
    });

    return Response.json(
      { trips },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Public trip search failed", error);
    return Response.json({ error: "Unable to search trips" }, { status: 500 });
  }
}
