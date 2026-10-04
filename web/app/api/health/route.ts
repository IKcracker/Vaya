import {
  checkDatabaseConnection,
  isDatabaseConfigured,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = isDatabaseConfigured();
  const databaseConnected = databaseConfigured
    ? await checkDatabaseConnection()
    : false;

  return Response.json(
    {
      ok: databaseConfigured ? databaseConnected : true,
      databaseConfigured,
      databaseConnected,
      service: "vaya-web",
    },
    {
      status: databaseConfigured && !databaseConnected ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
