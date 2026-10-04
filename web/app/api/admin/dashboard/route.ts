import { getAdminDashboard } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { configured: false, error: "DATABASE_URL is not configured" },
      { status: 503 }
    );
  }

  try {
    const data = await getAdminDashboard();
    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Admin dashboard load failed", error);
    return Response.json(
      { configured: true, error: "Unable to load CRM data" },
      { status: 500 }
    );
  }
}
