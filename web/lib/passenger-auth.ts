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
  const configured = process.env.NEON_AUTH_ORIGIN?.trim();
  return configured ? new URL(configured).origin : getSiteUrl().origin;
}

export class PassengerAuthError extends Error {
  constructor(message: string, public status = 503) {
    super(message);
  }
}

export async function requestPassengerAuth(path: string, init?: RequestInit) {
  if (!isPassengerAuthConfigured()) {
    throw new PassengerAuthError("Passenger authentication is not configured");
  }
  try {
    return await fetch(`${getPassengerAuthBaseUrl()}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        origin: getPassengerAuthOrigin(),
        ...init?.headers,
      },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new PassengerAuthError("Authentication service is temporarily unavailable. Please try again.");
  }
}

export function passengerAuthFailure(error: unknown) {
  return Response.json(
    { error: error instanceof PassengerAuthError ? error.message : "Authentication service is temporarily unavailable. Please try again." },
    { status: error instanceof PassengerAuthError ? error.status : 503, headers: { "Cache-Control": "no-store" } }
  );
}

export function upstreamAuthFailure(status: number, payload: { message?: string; error?: string; code?: string } | null) {
  const message = payload?.message ?? payload?.error;
  if (/invalid origin/i.test(message ?? "") || payload?.code === "INVALID_ORIGIN") {
    throw new PassengerAuthError("Authentication origin is not trusted. Configure NEON_AUTH_ORIGIN and allow that origin in the Neon Auth branch used by this deployment.");
  }
  if (status >= 500 || status === 404 || status === 429) {
    throw new PassengerAuthError(status === 429 ? "Too many attempts. Please try again later." : "Authentication service is temporarily unavailable. Please try again.", status === 429 ? 429 : 503);
  }
}

export async function getPassengerSession(
  cookieHeader: string
): Promise<PassengerSession> {
  const baseUrl = authBaseUrl();

  if (!baseUrl) {
    return { status: "unconfigured" };
  }

  if (!cookieHeader) return { status: "unauthenticated" };

  const response = await requestPassengerAuth("/get-session", {
    method: "GET",
    headers: {
      accept: "application/json",
      cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    if (response.status === 401) return { status: "unauthenticated" };
    throw new PassengerAuthError("Unable to verify your session. Please try again.");
  }

  const payload = (await response.json().catch(() => {
    throw new PassengerAuthError("Authentication service returned an invalid response. Please try again.");
  })) as
    | { user?: PassengerAuthUser | null }
    | null;

  if (payload === null) return { status: "unauthenticated" };
  if (typeof payload !== "object" || Array.isArray(payload)) throw new PassengerAuthError("Authentication service returned an invalid response. Please try again.");
  if (!payload?.user?.email) {
    if (payload.user) throw new PassengerAuthError("Authentication service returned an invalid user. Please try again.");
    return { status: "unauthenticated" };
  }

  return { status: "authenticated", user: payload.user };
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
  const values = setCookies.length ? setCookies : (headers.get("set-cookie") ?? "").split(/,(?=\s*[^;,=\s]+=)/);

  const cookiePairs = values
    .map((value) => value.split(";")[0]?.trim())
    .filter((value) => Boolean(value) && !value.endsWith("="));

  return cookiePairs.join("; ");
}

export function getMobileSessionCookie(request: Request) {
  return request.headers.get("x-vaya-session")?.trim() ?? "";
}
