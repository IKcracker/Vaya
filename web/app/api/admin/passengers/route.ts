import { createPassenger } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";

function postgresCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  if ("cause" in error) return postgresCode(error.cause);
  return undefined;
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";

  if (!name || !city || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Invalid passenger details" }, { status: 400 });
  }

  try {
    const passenger = await createPassenger({ name, email, city });
    return Response.json({ passenger }, { status: 201 });
  } catch (error) {
    if (postgresCode(error) === "23505") {
      return Response.json({ error: "A passenger with this email already exists" }, { status: 409 });
    }
    console.error("Passenger creation failed", error);
    return Response.json({ error: "Unable to create passenger" }, { status: 500 });
  }
}
