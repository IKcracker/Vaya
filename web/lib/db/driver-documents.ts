import "server-only";

import { and, eq } from "drizzle-orm";

import {
  DRIVER_DOCUMENTS,
  REQUIRED_DRIVER_DOCUMENTS,
  type DriverDocumentKind,
} from "@/lib/driver-verification";
import { getDb } from "./index";
import { activityLogs, driverDocuments, drivers } from "./schema";

export type DriverDocumentStatus =
  | "Review"
  | "Approved"
  | "Needs info"
  | "Rejected";

export const DRIVER_DOCUMENT_STATUSES = new Set<DriverDocumentStatus>([
  "Review",
  "Approved",
  "Needs info",
  "Rejected",
]);

function shapeDocument(
  document: typeof driverDocuments.$inferSelect
) {
  const definition = DRIVER_DOCUMENTS.find(
    (item) => item.kind === document.kind
  );

  return {
    id: document.id,
    kind: document.kind as DriverDocumentKind,
    label: definition?.label ?? document.kind,
    required: definition?.required ?? false,
    fileName: document.fileName,
    contentType: document.contentType,
    sizeBytes: document.sizeBytes,
    status: document.status,
    reviewNote: document.reviewNote ?? "",
    uploadedAt: document.uploadedAt.toISOString(),
    reviewedAt: document.reviewedAt?.toISOString() ?? null,
    updatedAt: document.updatedAt.toISOString(),
  };
}

export async function getDriverDocuments(driverId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(driverDocuments)
    .where(eq(driverDocuments.driverId, driverId));

  const order = new Map(
    DRIVER_DOCUMENTS.map((document, index) => [document.kind, index])
  );

  return rows
    .map(shapeDocument)
    .sort(
      (a, b) =>
        (order.get(a.kind) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.kind) ?? Number.MAX_SAFE_INTEGER)
    );
}

export async function getDriverVerificationSummary(driverId: string) {
  const documents = await getDriverDocuments(driverId);
  const byKind = new Map(documents.map((document) => [document.kind, document]));
  const requiredKinds = REQUIRED_DRIVER_DOCUMENTS.map((item) => item.kind);

  const uploadedRequired = requiredKinds.filter((kind) => byKind.has(kind));
  const approvedRequired = requiredKinds.filter(
    (kind) => byKind.get(kind)?.status === "Approved"
  );
  const missingKinds = requiredKinds.filter((kind) => !byKind.has(kind));
  const needsAttention = requiredKinds.filter((kind) => {
    const status = byKind.get(kind)?.status;
    return status === "Rejected" || status === "Needs info";
  });

  return {
    documents,
    requiredCount: requiredKinds.length,
    uploadedRequiredCount: uploadedRequired.length,
    approvedRequiredCount: approvedRequired.length,
    missingKinds,
    needsAttentionKinds: needsAttention,
    readyToApprove:
      missingKinds.length === 0 &&
      needsAttention.length === 0 &&
      approvedRequired.length === requiredKinds.length,
  };
}

function checksText(summary: Awaited<ReturnType<typeof getDriverVerificationSummary>>) {
  if (summary.missingKinds.length) {
    return `${summary.uploadedRequiredCount}/${summary.requiredCount} required documents uploaded`;
  }

  if (summary.needsAttentionKinds.length) {
    return `${summary.needsAttentionKinds.length} document${summary.needsAttentionKinds.length === 1 ? "" : "s"} need resubmission`;
  }

  if (summary.readyToApprove) {
    return "All required documents approved";
  }

  return `${summary.approvedRequiredCount}/${summary.requiredCount} required documents approved`;
}

async function syncDriverVerificationState(
  driverId: string,
  options?: { forceReview?: boolean }
) {
  const db = getDb();
  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.id, driverId))
    .limit(1);

  if (!driver) throw new Error("DRIVER_NOT_FOUND");

  const summary = await getDriverVerificationSummary(driverId);
  const protectedStatus =
    driver.status === "Suspended" || driver.status === "Removed";

  let status = driver.status;

  if (!protectedStatus) {
    if (summary.missingKinds.length || summary.needsAttentionKinds.length) {
      status = "Needs info";
    } else if (options?.forceReview || driver.status !== "Approved") {
      status = "Review";
    }
  }

  const checks = checksText(summary);

  await db
    .update(drivers)
    .set({
      checks,
      status,
      updatedAt: new Date(),
    })
    .where(eq(drivers.id, driverId));

  return { ...summary, checks, status };
}

export async function saveDriverDocumentByEmail(
  email: string,
  input: {
    kind: DriverDocumentKind;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    fileData: string;
  }
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.email, normalized))
    .limit(1);

  if (!driver) throw new Error("DRIVER_NOT_FOUND");

  const [existing] = await db
    .select()
    .from(driverDocuments)
    .where(
      and(
        eq(driverDocuments.driverId, driver.id),
        eq(driverDocuments.kind, input.kind)
      )
    )
    .limit(1);

  const now = new Date();
  let saved: typeof driverDocuments.$inferSelect;

  if (existing) {
    [saved] = await db
      .update(driverDocuments)
      .set({
        fileName: input.fileName,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        fileData: input.fileData,
        status: "Review",
        reviewNote: null,
        reviewedAt: null,
        uploadedAt: now,
        updatedAt: now,
      })
      .where(eq(driverDocuments.id, existing.id))
      .returning();
  } else {
    [saved] = await db
      .insert(driverDocuments)
      .values({
        driverId: driver.id,
        kind: input.kind,
        fileName: input.fileName,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        fileData: input.fileData,
        status: "Review",
      })
      .returning();
  }

  await db.insert(activityLogs).values({
    eventType: existing ? "driver_document_reuploaded" : "driver_document_uploaded",
    title: existing ? "Driver document replaced" : "Driver document uploaded",
    detail: `${driver.name} · ${input.kind}`,
    metadata: {
      driverId: driver.id,
      documentId: saved.id,
      kind: input.kind,
      source: "mobile",
    },
  });

  const verification = await syncDriverVerificationState(driver.id, {
    forceReview: REQUIRED_DRIVER_DOCUMENTS.some(
      (document) => document.kind === input.kind
    ),
  });

  return {
    document: shapeDocument(saved),
    verification,
  };
}

export async function reviewDriverDocument(
  driverId: string,
  documentId: string,
  input: {
    status: DriverDocumentStatus;
    reviewNote?: string | null;
  }
) {
  const db = getDb();
  const [document] = await db
    .update(driverDocuments)
    .set({
      status: input.status,
      reviewNote: input.reviewNote?.trim() || null,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(driverDocuments.id, documentId),
        eq(driverDocuments.driverId, driverId)
      )
    )
    .returning();

  if (!document) return null;

  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.id, driverId))
    .limit(1);

  await db.insert(activityLogs).values({
    eventType: "driver_document_reviewed",
    title: `Driver document ${input.status.toLowerCase()}`,
    detail: `${driver?.name ?? "Driver"} · ${document.kind}`,
    metadata: {
      driverId,
      documentId: document.id,
      kind: document.kind,
      status: input.status,
    },
  });

  const verification = await syncDriverVerificationState(driverId);

  return {
    document: shapeDocument(document),
    verification,
  };
}

export async function getDriverDocumentFile(
  driverId: string,
  documentId: string
) {
  const db = getDb();
  const [document] = await db
    .select()
    .from(driverDocuments)
    .where(
      and(
        eq(driverDocuments.id, documentId),
        eq(driverDocuments.driverId, driverId)
      )
    )
    .limit(1);

  if (!document) return null;

  return {
    fileName: document.fileName,
    contentType: document.contentType,
    sizeBytes: document.sizeBytes,
    fileData: document.fileData,
  };
}
