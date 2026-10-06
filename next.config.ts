import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Az adat/ mappa (Python pipeline) nem része a buildnek.
  outputFileTracingExcludes: {
    "*": ["./adat/**/*"],
  },
  // A standalone buildbe kerüljenek be a futásidőben fájlból olvasott adatok:
  // munkakör-JSON-ok (ISR-oldalak, sitemap) és az OG-kép betűi.
  outputFileTracingIncludes: {
    "/\\[slug\\]": ["./public/data/*.json"],
    "/\\[slug\\]/opengraph-image": ["./public/data/*.json", "./assets/fonts/*.ttf"],
    "/sitemap.xml": ["./public/data/kereso.json"],
  },
};

export default nextConfig;
