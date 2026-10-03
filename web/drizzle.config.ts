import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://vaya:vaya@localhost:5432/vaya",
  },
  strict: true,
  verbose: true,
});
