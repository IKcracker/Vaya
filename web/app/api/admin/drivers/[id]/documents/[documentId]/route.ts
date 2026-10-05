import { isDatabaseConfigured } from "@/lib/db";
import { getAdminAuth } from "@/lib/admin-auth";
import {
  DRIVER_DOCUMENT_STATUSES,
  getDriverDocumentFile,
  reviewDriverDocument,
  type DriverDocumentStatus,
} from "@/lib/db/driver-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const auth = await getAdminAuth(request.headers.get("cookie") ?? "");
  if (auth.status !== "authorized") return Response.json({ error: "Admin access required" }, { status: auth.status === "unconfigured" ? 503 : auth.status === "forbidden" ? 403 : 401 });
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const { id, documentId } = await params;
  const file = await getDriverDocumentFile(id, documentId);

  if (!file) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  const bytes = Buffer.from(file.fileData, "base64");

  return new Response(bytes, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `inline; filename="document"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const auth = await getAdminAuth(request.headers.get("cookie") ?? "");
  if (auth.status !== "authorized") return Response.json({ error: "Admin access required" }, { status: auth.status === "unconfigured" ? 503 : auth.status === "forbidden" ? 403 : 401 });
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const { id, documentId } = await params;
  const body = await request.json().catch(() => null);
  const status =
    typeof body?.status === "string" ? body.status.trim() : "";
  const reviewNote =
    typeof body?.reviewNote === "string" ? body.reviewNote.trim().slice(0, 1000) : "";
  const expectedUpdatedAt = typeof body?.expectedUpdatedAt === "string" ? body.expectedUpdatedAt : "";
  if (!expectedUpdatedAt || !Number.isFinite(Date.parse(expectedUpdatedAt))) return Response.json({ error: "Reload the document before reviewing it" }, { status: 400 });
  if (status === "Approved" && body?.confirmed !== true) return Response.json({ error: "Confirm you checked this document against the driver and vehicle details" }, { status: 400 });

  if (!DRIVER_DOCUMENT_STATUSES.has(status as DriverDocumentStatus)) {
    return Response.json({ error: "Invalid document review status" }, { status: 400 });
  }

  if ((status === "Needs info" || status === "Rejected") && !reviewNote) {
    return Response.json(
      { error: "Add a review note explaining what the driver must fix" },
      { status: 400 }
    );
  }

  try {
    const result = await reviewDriverDocument(id, documentId, {
      status: status as DriverDocumentStatus,
      reviewNote,
      expectedUpdatedAt,
      reviewer: auth.user.email ?? auth.user.id ?? "admin",
    });

    if (!result) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "DOCUMENT_CHANGED") return Response.json({ error: "This document was replaced or reviewed since you opened it. Refresh and review the latest file." }, { status: 409 });
    console.error("Driver document review failed", error);
    return Response.json({ error: "Unable to review driver document" }, { status: 500 });
  }
}
