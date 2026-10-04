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
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const newPassword =
    typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!token) {
    return Response.json(
      { error: "The password reset token is missing" },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(`${getNeonAuthBaseUrl()}/reset-password`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        origin: new URL(request.url).origin,
      },
      body: JSON.stringify({
        newPassword,
        token,
      }),
      cache: "no-store",
    });

    const payload = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return Response.json(
        {
          error:
            payload?.message ??
            payload?.error ??
            "The reset link is invalid or has expired",
        },
        { status: upstream.status === 429 ? 429 : 400 }
      );
    }

    return Response.json({
      ok: true,
      message: "Your password has been set. You can now sign in.",
    });
  } catch (error) {
    console.error("Password reset failed", error);
    return Response.json(
      { error: "Unable to contact the authentication service" },
      { status: 502 }
    );
  }
}
