import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

import {
  DRIVER_DOCUMENTS,
  PERSONAL_DRIVER_DOCUMENTS,
  VEHICLE_REQUIRED_DOCUMENTS,
  isPersonalDriverDocumentKind,
  isVehicleDriverDocumentKind,
  type DriverDocumentKind,
} from "@/lib/driver-verification";
import { getDb } from "./index";
import {
  activityLogs,
  driverDocuments,
  drivers,
  driverVehicles,
} from "./schema";

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
  document: Omit<typeof driverDocuments.$inferSelect, "fileData">
) {
  const definition = DRIVER_DOCUMENTS.find(
    (item) => item.kind === document.kind
  );

  return {
    id: document.id,
    vehicleId: document.vehicleId ?? null,
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

async function getDocumentsFor(
  driverId: string,
  vehicleId: string | null
) {
  const db = getDb();
  const rows = await db
    .select({
      id: driverDocuments.id,
      driverId: driverDocuments.driverId,
      vehicleId: driverDocuments.vehicleId,
      kind: driverDocuments.kind,
      fileName: driverDocuments.fileName,
      contentType: driverDocuments.contentType,
      sizeBytes: driverDocuments.sizeBytes,
      status: driverDocuments.status,
      reviewNote: driverDocuments.reviewNote,
      uploadedAt: driverDocuments.uploadedAt,
      reviewedAt: driverDocuments.reviewedAt,
      updatedAt: driverDocuments.updatedAt,
    })
    .from(driverDocuments)
    .where(
      vehicleId
        ? and(
            eq(driverDocuments.driverId, driverId),
            eq(driverDocuments.vehicleId, vehicleId)
          )
        : and(
            eq(driverDocuments.driverId, driverId),
            isNull(driverDocuments.vehicleId)
          )
    );

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

export async function getDriverDocuments(driverId: string) {
  return getDocumentsFor(driverId, null);
}

export async function getVehicleDocuments(driverId: string, vehicleId: string) {
  return getDocumentsFor(driverId, vehicleId);
}

function verificationSummary(
  documents: Awaited<ReturnType<typeof getDocumentsFor>>,
  requiredKinds: readonly string[]
) {
  const byKind = new Map<string, (typeof documents)[number]>(
    documents.map((document) => [document.kind, document])
  );
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

export async function getDriverVerificationSummary(driverId: string) {
  const documents = await getDriverDocuments(driverId);
  return verificationSummary(
    documents,
    PERSONAL_DRIVER_DOCUMENTS.map((item) => item.kind)
  );
}

export async function getVehicleVerificationSummary(
  driverId: string,
  vehicleId: string
) {
  const documents = await getVehicleDocuments(driverId, vehicleId);
  return verificationSummary(
    documents,
    VEHICLE_REQUIRED_DOCUMENTS.map((item) => item.kind)
  );
}

function checksText(
  summary: Awaited<ReturnType<typeof getDriverVerificationSummary>>
) {
  if (summary.missingKinds.length) {
    return `${summary.uploadedRequiredCount}/${summary.requiredCount} required documents uploaded`;
  }
  if (summary.needsAttentionKinds.length) {
    return `${summary.needsAttentionKinds.length} document${summary.needsAttentionKinds.length === 1 ? "" : "s"} need resubmission`;
  }
  if (summary.readyToApprove) return "All required documents approved";
  return `${summary.approvedRequiredCount}/${summary.requiredCount} required documents approved`;
}

async function syncDriverVerificationState(driverId: string) {
  const db = getDb();
  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.id, driverId))
    .limit(1);

  if (!driver) throw new Error("DRIVER_NOT_FOUND");

  const summary = await getDriverVerificationSummary(driverId);
  const protectedStatus =
    driver.status === "Suspended" ||
    driver.status === "Removed" ||
    driver.status === "Approved";

  let status = driver.status;
  if (!protectedStatus) {
    status =
      summary.missingKinds.length || summary.needsAttentionKinds.length
        ? "Needs info"
        : "Review";
  }

  const checks = checksText(summary);
  await db
    .update(drivers)
    .set({ checks, status, updatedAt: new Date() })
    .where(eq(drivers.id, driverId));

  return { ...summary, checks, status };
}

async function syncVehicleVerificationState(
  driverId: string,
  vehicleId: string
) {
  const db = getDb();
  const [vehicle] = await db
    .select()
    .from(driverVehicles)
    .where(
      and(
        eq(driverVehicles.id, vehicleId),
        eq(driverVehicles.driverId, driverId)
      )
    )
    .limit(1);

  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");

  const summary = await getVehicleVerificationSummary(driverId, vehicleId);
  let status = vehicle.status;

  if (status !== "Suspended" && status !== "Removed") {
    if (summary.readyToApprove) status = "Approved";
    else if (summary.missingKinds.length || summary.needsAttentionKinds.length) {
      status = "Needs info";
    } else {
      status = "Review";
    }
  }

  const checks = checksText(summary);
  await db
    .update(driverVehicles)
    .set({ checks, status, updatedAt: new Date() })
    .where(eq(driverVehicles.id, vehicleId));

  return { ...summary, checks, status };
}

export async function saveDriverDocumentByEmail(
  email: string,
  input: {
    kind: DriverDocumentKind;
    vehicleId?: string | null;
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

  let vehicleId: string | null = null;
  if (isVehicleDriverDocumentKind(input.kind)) {
    if (!input.vehicleId) throw new Error("VEHICLE_REQUIRED");
    const [vehicle] = await db
      .select({ id: driverVehicles.id })
      .from(driverVehicles)
      .where(
        and(
          eq(driverVehicles.id, input.vehicleId),
          eq(driverVehicles.driverId, driver.id)
        )
      )
      .limit(1);
    if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");
    vehicleId = vehicle.id;
  } else if (!isPersonalDriverDocumentKind(input.kind)) {
    throw new Error("INVALID_DOCUMENT_KIND");
  }

  const vehicleCondition = vehicleId
    ? eq(driverDocuments.vehicleId, vehicleId)
    : isNull(driverDocuments.vehicleId);

  const [existing] = await db
    .select()
    .from(driverDocuments)
    .where(
      and(
        eq(driverDocuments.driverId, driver.id),
        vehicleCondition,
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
        vehicleId,
        kind: input.kind,
        fileName: input.fileName,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        fileData: input.fileData,
        status: "Review",
        uploadedAt: now,
        updatedAt: now,
      })
      .returning();
  }

  await db.insert(activityLogs).values({
    eventType: existing ? "driver_document_reuploaded" : "driver_document_uploaded",
    title: existing ? "Driver document replaced" : "Driver document uploaded",
    detail: `${driver.name} · ${input.kind}`,
    metadata: {
      driverId: driver.id,
      vehicleId,
      documentId: saved.id,
      kind: input.kind,
      source: "mobile",
    },
  });

  if (vehicleId) {
    const verification = await syncVehicleVerificationState(driver.id, vehicleId);
    return { document: shapeDocument(saved), verification, scope: "vehicle" as const };
  }

  const verification = await syncDriverVerificationState(driver.id);
  return { document: shapeDocument(saved), verification, scope: "driver" as const };
}

export async function reviewDriverDocument(
  driverId: string,
  documentId: string,
  input: {
    status: DriverDocumentStatus;
    reviewNote?: string | null;
    expectedUpdatedAt: string;
    reviewer: string;
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
        eq(driverDocuments.driverId, driverId),
        sql`date_trunc('milliseconds', ${driverDocuments.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`
      )
    )
    .returning();

  if (!document) throw new Error("DOCUMENT_CHANGED");

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
      vehicleId: document.vehicleId,
      documentId: document.id,
      kind: document.kind,
      status: input.status,
      reviewer: input.reviewer,
      reviewedVersion: input.expectedUpdatedAt,
      reviewNote: input.reviewNote?.trim() || null,
    },
  });

  const verification = document.vehicleId
    ? await syncVehicleVerificationState(driverId, document.vehicleId)
    : await syncDriverVerificationState(driverId);

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
