import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { activityLogs, drivers, passengers } from "./schema";

export async function getPassengerProfileImageByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const [passenger] = await db
    .select({
      id: passengers.id,
      contentType: passengers.profileImageContentType,
      fileData: passengers.profileImageData,
      updatedAt: passengers.profileImageUpdatedAt,
    })
    .from(passengers)
    .where(eq(passengers.email, normalized))
    .limit(1);

  if (!passenger?.contentType || !passenger.fileData) return null;
  return passenger;
}

export async function savePassengerProfileImageByEmail(
  email: string,
  input: { contentType: string; fileData: string }
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const now = new Date();

  const [passenger] = await db
    .update(passengers)
    .set({
      profileImageContentType: input.contentType,
      profileImageData: input.fileData,
      profileImageUpdatedAt: now,
      updatedAt: now,
    })
    .where(eq(passengers.email, normalized))
    .returning({
      id: passengers.id,
      profileImageUpdatedAt: passengers.profileImageUpdatedAt,
    });

  if (!passenger) return null;

  await db.insert(activityLogs).values({
    eventType: "passenger_profile_photo_updated",
    title: "Profile photo updated",
    detail: normalized,
    metadata: { passengerId: passenger.id, source: "mobile" },
  });

  return passenger;
}

export async function removePassengerProfileImageByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const now = new Date();

  const [passenger] = await db
    .update(passengers)
    .set({
      profileImageContentType: null,
      profileImageData: null,
      profileImageUpdatedAt: null,
      updatedAt: now,
    })
    .where(eq(passengers.email, normalized))
    .returning({ id: passengers.id });

  if (!passenger) return null;

  await db.insert(activityLogs).values({
    eventType: "passenger_profile_photo_removed",
    title: "Profile photo removed",
    detail: normalized,
    metadata: { passengerId: passenger.id, source: "mobile" },
  });

  return passenger;
}

export async function getPassengerProfileImageById(passengerId: string) {
  const db = getDb();

  const [passenger] = await db
    .select({
      contentType: passengers.profileImageContentType,
      fileData: passengers.profileImageData,
      updatedAt: passengers.profileImageUpdatedAt,
    })
    .from(passengers)
    .where(eq(passengers.id, passengerId))
    .limit(1);

  if (!passenger?.contentType || !passenger.fileData) return null;
  return passenger;
}

export async function getDriverProfileImageById(driverId: string) {
  const db = getDb();

  const [row] = await db
    .select({
      contentType: passengers.profileImageContentType,
      fileData: passengers.profileImageData,
      updatedAt: passengers.profileImageUpdatedAt,
      driverStatus: drivers.status,
    })
    .from(drivers)
    .innerJoin(passengers, eq(passengers.email, drivers.email))
    .where(eq(drivers.id, driverId))
    .limit(1);

  if (!row?.contentType || !row.fileData) return null;
  return row;
}
