import {
  getNeonAuthBaseUrl,
  isAdminAuthConfigured,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json(
      { error: "Enter a valid email address" },
      { status: 400 }
    );
  }

  const resetUrl = new URL("/admin/reset-password", request.url).toString();

  try {
    const upstream = await fetch(
      `${getNeonAuthBaseUrl()}/request-password-reset`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          origin: new URL(request.url).origin,
        },
        body: JSON.stringify({
          email,
          redirectTo: resetUrl,
        }),
        cache: "no-store",
      }
    );

    if (upstream.status === 429) {
      return Response.json(
        { error: "Too many reset attempts. Try again shortly." },
        { status: 429 }
      );
    }

    if (!upstream.ok) {
      const payload = await upstream.json().catch(() => null);
      console.error("Neon Auth password reset request failed", payload);
      return Response.json(
        {
          error:
            "Unable to send the reset email. Check the Neon Auth email configuration.",
        },
        { status: 502 }
      );
    }

    return Response.json({
      ok: true,
      message:
        "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Password reset request failed", error);
    return Response.json(
      { error: "Unable to contact the authentication service" },
      { status: 502 }
    );
  }
}
