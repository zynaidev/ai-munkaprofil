import type { MetadataRoute } from "next";
import { getIndexelhetoSlugok } from "@/lib/data";
import { oldalUrl } from "@/lib/seo";

// Csak az indexelhető munkakörök + kezdőoldal + módszertan + adatkezelés (CLAUDE.md 7. szabály). A 404 nincs benne.
export default function sitemap(): MetadataRoute.Sitemap {
  const alap = oldalUrl();
  return [
    { url: `${alap}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${alap}/modszertan`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${alap}/adatkezeles`, changeFrequency: "yearly", priority: 0.2 },
    ...getIndexelhetoSlugok().map((slug) => ({
      url: `${alap}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
