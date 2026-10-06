import { isDatabaseConfigured } from "@/lib/db";
import {
  getMobileConversationByEmail,
  getMobileMessageThreadsByEmail,
  sendMobileMessageByEmail,
} from "@/lib/db/public";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authEmail(request: Request) {
  const auth = await getPassengerSession(getMobileSessionCookie(request));

  if (auth.status === "unconfigured") {
    return { error: Response.json({ error: "Passenger authentication is not configured" }, { status: 503 }) };
  }

  if (auth.status !== "authenticated" || !auth.user.email) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { email: auth.user.email };
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const recipient = url.searchParams.get("recipient")?.trim().toLowerCase();

  try {
    if (recipient) {
      const conversation = await getMobileConversationByEmail(auth.email, recipient);
      return Response.json({ conversation }, { headers: { "Cache-Control": "no-store" } });
    }

    const threads = await getMobileMessageThreadsByEmail(auth.email);
    return Response.json({ threads }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "MESSAGE_CONTACT_NOT_ALLOWED") {
      return Response.json({ error: "Messaging is only available between users with a shared Vaya trip" }, { status: 403 });
    }

    console.error("Mobile messages fetch failed", error);
    return Response.json({ error: "Unable to load messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const recipientEmail =
    typeof body?.recipientEmail === "string" ? body.recipientEmail.trim().toLowerCase() : "";
  const messageBody = typeof body?.body === "string" ? body.body.trim() : "";

  if (!recipientEmail || messageBody.length < 1 || messageBody.length > 2000) {
    return Response.json({ error: "Recipient and message are required" }, { status: 400 });
  }

  try {
    const message = await sendMobileMessageByEmail(auth.email, {
      recipientEmail,
      body: messageBody,
    });
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "MESSAGE_CONTACT_NOT_ALLOWED") {
      return Response.json({ error: "Messaging is only available between users with a shared Vaya trip" }, { status: 403 });
    }

    console.error("Mobile message send failed", error);
    return Response.json({ error: "Unable to send message" }, { status: 500 });
  }
}
