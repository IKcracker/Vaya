import { isDatabaseConfigured } from "@/lib/db";
import { saveDriverDocumentByEmail } from "@/lib/db/driver-documents";
import { validateDriverDocument } from "@/lib/driver-document-upload";
import {
  isDriverDocumentKind,
} from "@/lib/driver-verification";
import {
  getMobileSessionCookie,
  getPassengerSession,
  passengerAuthFailure,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  let auth;
  try {
    auth = await getPassengerSession(getMobileSessionCookie(request));
  } catch (error) {
    return passengerAuthFailure(error);
  }

  if (auth.status === "unconfigured") {
    return Response.json(
      { error: "Passenger authentication is not configured" },
      { status: 503 }
    );
  }

  if (auth.status !== "authenticated" || !auth.user.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const kind = typeof body?.kind === "string" ? body.kind : "";
  const fileName =
    typeof body?.fileName === "string" ? body.fileName.trim().slice(0, 255) : "";
  const contentType =
    typeof body?.contentType === "string" ? body.contentType.trim().toLowerCase() : "";
  const fileData =
    typeof body?.fileData === "string" ? body.fileData.replace(/^data:[^;]+;base64,/, "") : "";

  if (!isDriverDocumentKind(kind)) {
    return Response.json({ error: "Invalid driver document type" }, { status: 400 });
  }

  if (!fileName || !fileData || !ALLOWED_CONTENT_TYPES.has(contentType)) {
    return Response.json(
      { error: "Upload a PDF, JPG, PNG or WEBP document" },
      { status: 400 }
    );
  }

  const validated = validateDriverDocument(contentType, fileData);
  if ("error" in validated) return Response.json({ error: validated.error }, { status: validated.status });

  try {
    const result = await saveDriverDocumentByEmail(auth.user.email, {
      kind,
      fileName,
      contentType,
      sizeBytes: validated.sizeBytes,
      fileData: validated.fileData,
    });

    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "DRIVER_NOT_FOUND") {
      return Response.json(
        { error: "Submit your driver application before uploading documents" },
        { status: 409 }
      );
    }

    console.error("Driver document upload failed", error);
    return Response.json({ error: "Unable to upload driver document" }, { status: 500 });
  }
}
