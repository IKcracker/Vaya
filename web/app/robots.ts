import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const isPreview = process.env.VERCEL_ENV === "preview";
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: isPreview ? undefined : "/",
      disallow: isPreview ? "/" : undefined,
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
