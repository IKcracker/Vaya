import {
  getPassengerAuthBaseUrl,
  getPassengerAuthOrigin,
  isPassengerAuthConfigured,
  sessionCookieFromHeaders,
  type PassengerAuthUser,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isPassengerAuthConfigured()) {
    return Response.json({ error: "Passenger authentication is not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return Response.json({ error: "Enter a valid email and password" }, { status: 400 });
  }

  const upstream = await fetch(`${getPassengerAuthBaseUrl()}/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      origin: getPassengerAuthOrigin(),
    },
    body: JSON.stringify({ email, password, rememberMe: true }),
    cache: "no-store",
  });

  const payload = (await upstream.json().catch(() => null)) as
    | { user?: PassengerAuthUser | null; message?: string; error?: string }
    | null;

  if (!upstream.ok || !payload?.user?.email) {
    return Response.json(
      { error: payload?.message ?? payload?.error ?? "Invalid credentials" },
      { status: upstream.status === 429 ? 429 : 401 }
    );
  }

  const session = sessionCookieFromHeaders(upstream.headers);

  if (!session) {
    return Response.json(
      { error: "Authentication succeeded but no mobile session was returned" },
      { status: 502 }
    );
  }

  return Response.json(
    { user: payload.user, session },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
