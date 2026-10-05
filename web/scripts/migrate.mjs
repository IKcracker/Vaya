import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const webDirectory = fileURLToPath(new URL("../", import.meta.url));
const migrationsFolder = fileURLToPath(new URL("../drizzle/", import.meta.url));
nextEnv.loadEnvConfig(webDirectory);

async function checkSchema(sql) {
  const journal = JSON.parse(readFileSync(`${migrationsFolder}/meta/_journal.json`, "utf8"));
  const last = journal.entries.at(-1);
  const snapshot = JSON.parse(readFileSync(`${migrationsFolder}/meta/${String(last.idx).padStart(4, "0")}_snapshot.json`, "utf8"));
  const columns = await sql.query("select table_schema, table_name, column_name from information_schema.columns where table_schema = 'public'");
  const actual = new Set(columns.map((column) => `${column.table_schema}.${column.table_name}.${column.column_name}`));
  const missing = [];
  for (const [tableName, table] of Object.entries(snapshot.tables)) {
    for (const column of Object.keys(table.columns)) {
      if (!actual.has(`${tableName}.${column}`)) missing.push(`${tableName}.${column}`);
    }
  }
  if (missing.length) {
    throw new Error(`Missing database tables or columns: ${missing.join(", ")}. Run db:migrate against this deployment's DATABASE_URL.`);
  }
  console.log("Database schema matches all committed application tables and columns.");
}

async function main() {
  // Match the runtime database. An unpooled URL can accidentally point at another branch.
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required. Use the same database as the deployed application.");
  const sql = neon(process.env.DATABASE_URL);
  if (process.argv.includes("--check")) {
    await checkSchema(sql);
    return;
  }

  const migrations = readMigrationFiles({ migrationsFolder });
  await sql.transaction([
    sql.query('CREATE SCHEMA IF NOT EXISTS "drizzle"'),
    sql.query('CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)'),
  ]);
  const applied = await sql.query('SELECT hash, created_at FROM "drizzle"."__drizzle_migrations" ORDER BY created_at');
  const latest = Number(applied.at(-1)?.created_at ?? 0);
  const pending = migrations.filter((migration) => migration.folderMillis > latest);
  for (const migration of migrations) {
    const recorded = applied.find((entry) => Number(entry.created_at) === migration.folderMillis);
    if (recorded && recorded.hash !== migration.hash) throw new Error("A previously applied migration has changed. Restore the committed migration before continuing.");
  }
  if (pending.length) {
    // Submit schema changes and their journal records in one HTTP transaction.
    // Any failed statement rolls back the complete batch rather than leaving half a schema.
    const queries = [sql.query("SELECT pg_advisory_xact_lock(1791070196)")];
    for (const migration of pending) {
      queries.push(...migration.sql.filter((statement) => statement.trim()).map((statement) => sql.query(statement)));
      queries.push(sql.query('INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)', [migration.hash, migration.folderMillis]));
    }
    await sql.transaction(queries);
  }
  console.log(`Applied ${pending.length} pending migration(s) to DATABASE_URL.`);
  await checkSchema(sql);
}

main().catch((error) => {
  // Do not print connection strings or driver objects that may contain credentials.
  console.error(`Database migration/check failed: ${error.message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[database URL redacted]")}`);
  process.exitCode = 1;
});
