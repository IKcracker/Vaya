import {
  copyAuthCookies,
  getPassengerAuthBaseUrl,
  isPassengerAuthConfigured,
  type PassengerAuthUser,
} from "@/lib/passenger-auth";
import { ensurePassengerForAuthUser } from "@/lib/db/public";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isPassengerAuthConfigured()) {
    return Response.json({ error: "Passenger authentication is not configured" }, { status: 503 });
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";

  if (name.length < 2 || city.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return Response.json(
      { error: "Name, city, valid email and an 8-character password are required" },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${getPassengerAuthBaseUrl()}/sign-up/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      origin: new URL(request.url).origin,
    },
    body: JSON.stringify({ name, email, password }),
    cache: "no-store",
  });

  const payload = (await upstream.json().catch(() => null)) as
    | { user?: PassengerAuthUser | null; message?: string; error?: string }
    | null;

  if (!upstream.ok || !payload?.user?.email) {
    return Response.json(
      { error: payload?.message ?? payload?.error ?? "Unable to create account" },
      { status: upstream.status === 429 ? 429 : 400 }
    );
  }

  const passenger = await ensurePassengerForAuthUser({
    name: payload.user.name || name,
    email: payload.user.email,
    city,
  });

  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  copyAuthCookies(upstream.headers, headers);

  return new Response(JSON.stringify({ user: payload.user, passenger }), {
    status: 201,
    headers,
  });
}
