import {
  getNeonAuthBaseUrl,
  isAdminAuthConfigured,
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
    return Response.json({ ok: true });
  }

  const upstream = await fetch(`${getNeonAuthBaseUrl()}/sign-out`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      cookie: request.headers.get("cookie") ?? "",
      origin: new URL(request.url).origin,
    },
    body: "{}",
    cache: "no-store",
  });

  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  copySetCookie(upstream.headers, headers);

  return new Response(JSON.stringify({ ok: upstream.ok }), {
    status: upstream.ok ? 200 : upstream.status,
    headers,
  });
}
