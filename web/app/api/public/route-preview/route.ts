import { getRoutePreview } from "@/lib/maps/route-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from")?.trim() ?? "";
  const to = url.searchParams.get("to")?.trim() ?? "";

  if (!from || !to || from.toLowerCase() === to.toLowerCase()) {
    return Response.json({ error: "Choose two different places" }, { status: 400 });
  }

  const route = await getRoutePreview(from, to);

  if (!route) {
    return Response.json(
      { route: null, error: "Map route is not available for these places yet" },
      { status: 200, headers: { "Cache-Control": "public, max-age=3600" } }
    );
  }

  return Response.json(
    { route },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
  );
}
