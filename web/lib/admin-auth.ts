export type AdminAuthUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string | string[] | null;
};

export type AdminAuthResult =
  | { status: "authorized"; user: AdminAuthUser }
  | { status: "unauthenticated" }
  | { status: "forbidden"; user: AdminAuthUser }
  | { status: "unconfigured" };

function authBaseUrl() {
  return process.env.NEON_AUTH_BASE_URL?.replace(/\/$/, "") ?? "";
}

export function isAdminAuthConfigured() {
  return Boolean(authBaseUrl());
}

export function isAdminUser(user: AdminAuthUser | null | undefined) {
  if (!user) return false;

  const configuredEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const email = user.email?.trim().toLowerCase();
  if (email && configuredEmails.includes(email)) {
    return true;
  }

  const roles = Array.isArray(user.role)
    ? user.role
    : typeof user.role === "string"
      ? user.role.split(",").map((role) => role.trim())
      : [];

  return roles.some((role) => role.toLowerCase() === "admin");
}

export async function getAdminAuth(
  cookieHeader: string
): Promise<AdminAuthResult> {
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
      | { user?: AdminAuthUser | null }
      | null;

    const user = payload?.user ?? null;

    if (!user) {
      return { status: "unauthenticated" };
    }

    if (!isAdminUser(user)) {
      return { status: "forbidden", user };
    }

    return { status: "authorized", user };
  } catch (error) {
    console.error("Neon Auth session check failed", error);
    return { status: "unauthenticated" };
  }
}

export function getNeonAuthBaseUrl() {
  return authBaseUrl();
}
