import { getMobileSessionCookie, getPassengerSession } from "@/lib/passenger-auth";
import { getPassengerAccountByEmail } from "@/lib/db/public";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getPassengerSession(getMobileSessionCookie(request));

  if (session.status === "unconfigured") {
    return Response.json({ error: "Passenger authentication is not configured" }, { status: 503 });
  }

  if (session.status !== "authenticated") {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const passenger = await getPassengerAccountByEmail(session.user.email ?? "");

  return Response.json(
    {
      authenticated: true,
      user: session.user,
      passenger,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
