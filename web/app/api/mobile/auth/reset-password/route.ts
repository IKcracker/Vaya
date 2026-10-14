import {
  requestPassengerAuth,
  upstreamAuthFailure,
  passengerAuthFailure,
} from "@/lib/passenger-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const newPassword =
    typeof body?.newPassword === "string" ? body.newPassword : "";
  if (!token || newPassword.length < 8)
    return Response.json(
      {
        error:
          "A valid reset link and a password of at least 8 characters are required.",
      },
      { status: 400 },
    );
  try {
    const upstream = await requestPassengerAuth("/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
    if (!upstream.ok) {
      const payload = await upstream.json().catch(() => null);
      upstreamAuthFailure(upstream.status, payload);
      return Response.json(
        {
          error:
            "This reset link is invalid or has expired. Request a new link.",
        },
        { status: 400 },
      );
    }
    const result = await upstream.json().catch(() => null);
    if (
      !result ||
      typeof result !== "object" ||
      Array.isArray(result) ||
      result.status === false
    )
      return Response.json(
        {
          error:
            "Authentication service returned an invalid response. Please try again.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    return Response.json(
      { message: "Password updated. Return to Vaya and sign in." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return passengerAuthFailure(error);
  }
}
