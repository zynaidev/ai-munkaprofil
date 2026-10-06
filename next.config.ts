import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Az adat/ mappa (Python pipeline) nem része a buildnek.
  outputFileTracingExcludes: {
    "*": ["./adat/**/*"],
  },
};

export default nextConfig;
