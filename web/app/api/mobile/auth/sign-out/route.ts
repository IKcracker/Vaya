import {
  getMobileSessionCookie,
  isPassengerAuthConfigured,
  requestPassengerAuth,
  passengerAuthFailure,
  upstreamAuthFailure,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isPassengerAuthConfigured()) {
    return Response.json({ ok: true });
  }

  try {
    const upstream = await requestPassengerAuth("/sign-out", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        cookie: getMobileSessionCookie(request),
      },
      body: "{}",
      cache: "no-store",
    });

    if (!upstream.ok && upstream.status !== 401) {
      upstreamAuthFailure(upstream.status, await upstream.json().catch(() => null));
    }

    return Response.json(
      { ok: upstream.ok || upstream.status === 401 },
      {
        status: upstream.ok || upstream.status === 401 ? 200 : upstream.status,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    return passengerAuthFailure(error);
  }
}
