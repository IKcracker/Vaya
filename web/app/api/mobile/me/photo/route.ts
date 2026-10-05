import { isDatabaseConfigured } from "@/lib/db";
import {
  getPassengerProfileImageByEmail,
  removePassengerProfileImageByEmail,
  savePassengerProfileImageByEmail,
} from "@/lib/db/profile-images";
import { validateProfileImage } from "@/lib/profile-image-upload";
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

  const image = await getPassengerProfileImageByEmail(auth.email);
  if (!image) {
    return Response.json({ error: "Profile photo not found" }, { status: 404 });
  }

  const bytes = Buffer.from(image.fileData, "base64");

  return new Response(Uint8Array.from(bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-store",
    },
  });
}

export async function PUT(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const fileData = typeof body?.fileData === "string" ? body.fileData : "";
  const validated = validateProfileImage(contentType, fileData);

  if ("error" in validated) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const passenger = await savePassengerProfileImageByEmail(auth.email, {
    contentType: validated.contentType,
    fileData: validated.fileData,
  });

  if (!passenger) {
    return Response.json({ error: "Passenger profile not found" }, { status: 404 });
  }

  return Response.json({
    profileImageUrl: `/api/mobile/me/photo?version=${passenger.profileImageUpdatedAt?.getTime() ?? Date.now()}`,
  });
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;

  const passenger = await removePassengerProfileImageByEmail(auth.email);
  if (!passenger) {
    return Response.json({ error: "Passenger profile not found" }, { status: 404 });
  }

  return Response.json({ removed: true });
}
