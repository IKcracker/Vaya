import {
  requestPassengerAuth,
  upstreamAuthFailure,
  passengerAuthFailure,
} from "@/lib/passenger-auth";
import { getSiteUrl } from "@/lib/site-url";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(email))
    return Response.json(
      { error: "Enter a valid email address" },
      { status: 400 },
    );
  try {
    const upstream = await requestPassengerAuth("/request-password-reset", {
      method: "POST",
      body: JSON.stringify({
        email,
        redirectTo: new URL("/reset-password", getSiteUrl()).toString(),
      }),
    });
    if (!upstream.ok) {
      const payload = await upstream.json().catch(() => null);
      upstreamAuthFailure(upstream.status, payload);
      return Response.json(
        { error: "Unable to send a reset email. Please try again." },
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
      {
        message:
          "If an account exists for this email, a reset link has been sent.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return passengerAuthFailure(error);
  }
}
