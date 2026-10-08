import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonTransaction } from "drizzle-orm/neon-serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import * as schema from "./schema";

type Transaction = NeonTransaction<typeof schema, ExtractTablesWithRelations<typeof schema>>;

// HTTP queries cannot run interactive transactions. Keep the WebSocket pool
// scoped to this operation so serverless requests always release connections.
export async function withDbTransaction<T>(operation: (tx: Transaction) => Promise<T>): Promise<T> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });
  try {
    return await db.transaction(operation);
  } finally {
    await pool.end();
  }
}
