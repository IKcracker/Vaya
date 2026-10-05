import { getSiteUrl } from "./site-url";

export function mobileCorsHeaders(origin: string | null) {
  const allowed = new Set([
    getSiteUrl().origin,
    ...(process.env.MOBILE_WEB_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean),
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:8081", "http://localhost:19006", "http://127.0.0.1:8081"] : []),
  ]);
  if (!origin || !allowed.has(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Vaya-Session",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}
