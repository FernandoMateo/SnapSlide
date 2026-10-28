import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1, images: [`${SITE_URL}/og.jpg`] },
    { url: `${SITE_URL}/caja`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
