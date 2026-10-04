import { isDatabaseConfigured } from "@/lib/db";
import { getPassengerPaymentsByEmail } from "@/lib/db/public";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getPassengerSession(getMobileSessionCookie(request));

  if (auth.status === "unconfigured") {
    return Response.json({ error: "Passenger authentication is not configured" }, { status: 503 });
  }

  if (auth.status !== "authenticated" || !auth.user.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const payments = await getPassengerPaymentsByEmail(auth.user.email);

  return Response.json(
    { payments },
    { headers: { "Cache-Control": "no-store" } }
  );
}
