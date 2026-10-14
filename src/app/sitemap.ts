import type { MetadataRoute } from "next";
import { liveTools } from "@/lib/tools";
import { platforms } from "@/lib/platforms";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://social9.s4meer.com";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/editor`, lastModified: now, priority: 0.9 },
    ...liveTools.map((t) => ({ url: `${base}/${t.slug}`, lastModified: now, priority: 0.8 })),
    ...platforms.map((p) => ({ url: `${base}/platforms/${p.id}`, lastModified: now, priority: 0.7 })),
    ...["how-it-works", "support", "privacy-policy", "terms", "cookies", "accessibility", "licenses"].map((p) => ({ url: `${base}/${p}`, lastModified: now, priority: 0.3 })),
  ];
}
