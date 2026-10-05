import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/admin-auth";
import { mobileCorsHeaders } from "@/lib/mobile-cors";

function loginUrl(request: NextRequest, reason?: string) {
  const url = new URL("/admin/login", request.url);
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.searchParams.set("next", next);

  if (reason) {
    url.searchParams.set("reason", reason);
  }

  return url;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/mobile/") || pathname.startsWith("/api/public/")) {
    const headers = mobileCorsHeaders(request.headers.get("origin"));
    if (request.method === "OPTIONS") {
      return new Response(null, { status: headers ? 204 : 403, headers: headers ?? { Vary: "Origin" } });
    }
    const response = NextResponse.next();
    for (const [name, value] of Object.entries(headers ?? {})) response.headers.set(name, value);
    return response;
  }

  if (
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password" ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  const auth = await getAdminAuth(request.headers.get("cookie") ?? "");
  const isApi = pathname.startsWith("/api/admin/");

  if (auth.status === "unconfigured") {
    if (isApi) {
      return Response.json(
        { error: "Admin authentication is not configured" },
        { status: 503 }
      );
    }

    return NextResponse.redirect(loginUrl(request, "unconfigured"));
  }

  if (auth.status === "unauthenticated") {
    if (isApi) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(loginUrl(request));
  }

  if (auth.status === "forbidden") {
    if (isApi) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.redirect(loginUrl(request, "forbidden"));
  }

  const response = NextResponse.next();
  if (auth.user.id) response.headers.set("x-vaya-admin-id", auth.user.id);
  if (auth.user.email) response.headers.set("x-vaya-admin-email", auth.user.email);
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/mobile/:path*", "/api/public/:path*"],
};
