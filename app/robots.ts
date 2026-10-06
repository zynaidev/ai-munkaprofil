import type { MetadataRoute } from "next";
import { oldalUrl } from "@/lib/seo";

// Mindent engedélyez; a nem indexelhető munkakörök oldalanként kapnak noindex-et.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${oldalUrl()}/sitemap.xml`,
  };
}
