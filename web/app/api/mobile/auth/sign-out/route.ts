import {
  getMobileSessionCookie,
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
      cookie: getMobileSessionCookie(request),
      origin: new URL(request.url).origin,
    },
    body: "{}",
    cache: "no-store",
  });

  return Response.json(
    { ok: upstream.ok },
    {
      status: upstream.ok ? 200 : upstream.status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
