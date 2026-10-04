import { getSiteUrl } from "./site-url";

export type PassengerAuthUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string | string[] | null;
  roles?: string[] | null;
};

export type PassengerSession =
  | { status: "authenticated"; user: PassengerAuthUser }
  | { status: "unauthenticated" }
  | { status: "unconfigured" };

function authBaseUrl() {
  return process.env.NEON_AUTH_BASE_URL?.replace(/\/$/, "") ?? "";
}

export function isPassengerAuthConfigured() {
  return Boolean(authBaseUrl());
}

export function getPassengerAuthBaseUrl() {
  return authBaseUrl();
}

export function getPassengerAuthOrigin() {
  return getSiteUrl().origin;
}

export async function getPassengerSession(
  cookieHeader: string
): Promise<PassengerSession> {
  const baseUrl = authBaseUrl();

  if (!baseUrl) {
    return { status: "unconfigured" };
  }

  try {
    const response = await fetch(`${baseUrl}/get-session`, {
      method: "GET",
      headers: {
        accept: "application/json",
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { status: "unauthenticated" };
    }

    const payload = (await response.json().catch(() => null)) as
      | { user?: PassengerAuthUser | null }
      | null;

    if (!payload?.user?.email) {
      return { status: "unauthenticated" };
    }

    return { status: "authenticated", user: payload.user };
  } catch (error) {
    console.error("Passenger Neon Auth session check failed", error);
    return { status: "unauthenticated" };
  }
}

export function copyAuthCookies(source: Headers, target: Headers) {
  const enhanced = source as Headers & { getSetCookie?: () => string[] };
  const cookies = enhanced.getSetCookie?.() ?? [];

  if (cookies.length) {
    for (const cookie of cookies) {
      target.append("set-cookie", cookie);
    }
    return;
  }

  const cookie = source.get("set-cookie");
  if (cookie) {
    target.append("set-cookie", cookie);
  }
}


export function sessionCookieFromHeaders(headers: Headers) {
  const enhanced = headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = enhanced.getSetCookie?.() ?? [];
  const values = setCookies.length ? setCookies : [headers.get("set-cookie") ?? ""].filter(Boolean);

  const cookiePairs = values
    .map((value) => value.split(";")[0]?.trim())
    .filter(Boolean);

  return cookiePairs.join("; ");
}

export function getMobileSessionCookie(request: Request) {
  return request.headers.get("x-vaya-session")?.trim() ?? "";
}
