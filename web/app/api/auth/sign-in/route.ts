import {
  getNeonAuthBaseUrl,
  isAdminAuthConfigured,
  isAdminUser,
  type AdminAuthUser,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function copySetCookie(source: Headers, target: Headers) {
  const enhanced = source as Headers & { getSetCookie?: () => string[] };
  const cookies = enhanced.getSetCookie?.() ?? [];

  if (cookies.length) {
    for (const cookie of cookies) {
      target.append("set-cookie", cookie);
    }
    return;
  }

  const cookie = source.get("set-cookie");
  if (cookie) target.append("set-cookie", cookie);
}

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return Response.json(
      { error: "Neon Auth is not configured" },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return Response.json(
      { error: "Enter a valid email and password" },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${getNeonAuthBaseUrl()}/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      origin: new URL(request.url).origin,
    },
    body: JSON.stringify({
      email,
      password,
      rememberMe: true,
    }),
    cache: "no-store",
  });

  const payload = (await upstream.json().catch(() => null)) as
    | { user?: AdminAuthUser | null; message?: string; error?: string }
    | null;

  if (!upstream.ok) {
    return Response.json(
      { error: payload?.message ?? payload?.error ?? "Invalid credentials" },
      { status: upstream.status === 429 ? 429 : 401 }
    );
  }

  const user = payload?.user ?? { email };

  if (!isAdminUser(user)) {
    return Response.json(
      { error: "This account does not have Vaya admin access" },
      { status: 403 }
    );
  }

  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  copySetCookie(upstream.headers, headers);

  return new Response(JSON.stringify({ ok: true, user }), {
    status: 200,
    headers,
  });
}
