import { isDatabaseConfigured } from "@/lib/db";
import {
  getMobilePrivacyPreferencesByEmail,
  updateMobilePrivacyPreferencesByEmail,
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

  const preferences = await getMobilePrivacyPreferencesByEmail(auth.email);
  return Response.json({ preferences }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const input = {
    profileVisible:
      typeof body?.profileVisible === "boolean" ? body.profileVisible : undefined,
    sharePhone:
      typeof body?.sharePhone === "boolean" ? body.sharePhone : undefined,
    locationSharing:
      typeof body?.locationSharing === "boolean" ? body.locationSharing : undefined,
  };

  const preferences = await updateMobilePrivacyPreferencesByEmail(auth.email, input);
  return Response.json({ preferences });
}
