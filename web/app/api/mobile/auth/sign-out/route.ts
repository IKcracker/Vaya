import {
  copyAuthCookies,
  getPassengerAuthBaseUrl,
  isPassengerAuthConfigured,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isPassengerAuthConfigured()) {
    return Response.json({ ok: true });
  }

  const upstream = await fetch(`${getPassengerAuthBaseUrl()}/sign-out`, {
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
  copyAuthCookies(upstream.headers, headers);

  return new Response(JSON.stringify({ ok: upstream.ok }), {
    status: upstream.ok ? 200 : upstream.status,
    headers,
  });
}
