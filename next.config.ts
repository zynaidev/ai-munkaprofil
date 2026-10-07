import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Az adat/ mappa (Python pipeline) nem része a buildnek.
  outputFileTracingExcludes: {
    "*": ["./adat/**/*"],
  },
  // A standalone buildbe kerüljenek be a futásidőben fájlból olvasott adatok:
  // munkakör-JSON-ok (ISR-oldalak, sitemap) és az OG-kép betűi és logója.
  outputFileTracingIncludes: {
    "/\\[slug\\]": ["./public/data/*.json"],
    "/\\[slug\\]/opengraph-image": ["./public/data/*.json", "./assets/fonts/*.ttf", "./public/brand/ZynAI_logo_light.png"],
    "/sitemap.xml": ["./public/data/kereso.json"],
    "/_not-found": ["./public/data/*.json"], // a lábléc adatverziója
    "/api/visszajelzes": ["./public/data/*.json"], // az adatverzió a payloadban
  },
  // Biztonsági fejlécek minden útvonalra (middleware/proxy nélkül)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
