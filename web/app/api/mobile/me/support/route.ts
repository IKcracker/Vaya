import { isDatabaseConfigured } from "@/lib/db";
import { createMobileSupportRequestByEmail } from "@/lib/db/public";
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
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (subject.length < 3 || subject.length > 160 || message.length < 10 || message.length > 3000) {
    return Response.json({ error: "Add a subject and enough detail for Vaya Support" }, { status: 400 });
  }

  try {
    const supportRequest = await createMobileSupportRequestByEmail(auth.user.email, {
      subject,
      message,
    });
    return Response.json({ supportRequest }, { status: 201 });
  } catch (error) {
    console.error("Mobile support request failed", error);
    return Response.json({ error: "Unable to send support request" }, { status: 500 });
  }
}
