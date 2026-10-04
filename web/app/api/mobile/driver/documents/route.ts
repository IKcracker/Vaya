import { isDatabaseConfigured } from "@/lib/db";
import { saveDriverDocumentByEmail } from "@/lib/db/driver-documents";
import {
  isDriverDocumentKind,
} from "@/lib/driver-verification";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function base64ByteLength(value: string) {
  const normalized = value.replace(/\s/g, "");
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await getPassengerSession(getMobileSessionCookie(request));

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

  const sizeBytes = base64ByteLength(fileData);

  if (sizeBytes <= 0 || sizeBytes > MAX_FILE_BYTES) {
    return Response.json(
      { error: "Each driver document must be 5 MB or smaller" },
      { status: 413 }
    );
  }

  try {
    const result = await saveDriverDocumentByEmail(auth.user.email, {
      kind,
      fileName,
      contentType,
      sizeBytes,
      fileData,
    });

    return Response.json(result, { status: 201 });
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
