import { isDatabaseConfigured } from "@/lib/db";
import { createMobileSafetyCaseByEmail } from "@/lib/db/public";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => null);
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const tripId = typeof body?.tripId === "string" && body.tripId.trim()
    ? body.tripId.trim()
    : null;

  if (subject.length < 3 || note.length < 10) {
    return Response.json(
      { error: "Add a subject and enough detail for Vaya Operations to investigate" },
      { status: 400 }
    );
  }

  try {
    const safetyCase = await createMobileSafetyCaseByEmail(auth.user.email, {
      subject,
      note,
      tripId,
    });

    return Response.json({ safetyCase }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "TRIP_NOT_FOUND") {
      return Response.json({ error: "That trip is not linked to your account" }, { status: 404 });
    }

    console.error("Mobile safety report failed", error);
    return Response.json({ error: "Unable to submit safety report" }, { status: 500 });
  }
}
