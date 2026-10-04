import "server-only";

import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  return drizzle(connectionString, { schema });
}

export async function checkDatabaseConnection() {
  if (!isDatabaseConfigured()) {
    return false;
  }

  try {
    const db = getDb();
    await db.execute(sql`select 1 as ok`);
    return true;
  } catch (error) {
    console.error("Database health check failed", error);
    return false;
  }
}
