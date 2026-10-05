import { isDatabaseConfigured } from "@/lib/db";
import { getDriverProfileImageById } from "@/lib/db/profile-images";

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
  const image = await getDriverProfileImageById(id);

  if (!image || image.driverStatus !== "Approved") {
    return Response.json({ error: "Driver profile photo not found" }, { status: 404 });
  }

  const bytes = Buffer.from(image.fileData, "base64");

  return new Response(Uint8Array.from(bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
