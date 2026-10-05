import { getMobileSessionCookie, getPassengerSession, passengerAuthFailure } from "@/lib/passenger-auth";
import { ensurePassengerForAuthUser } from "@/lib/db/public";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
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

    const passenger = await ensurePassengerForAuthUser({ name: session.user.name || session.user.email || "Passenger", email: session.user.email ?? "", city: "" });

    return Response.json(
      {
        authenticated: true,
        user: session.user,
        passenger,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return passengerAuthFailure(error);
  }
}
