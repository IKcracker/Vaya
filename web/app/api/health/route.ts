import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    databaseConfigured: isDatabaseConfigured(),
    service: "vaya-web",
  });
}
