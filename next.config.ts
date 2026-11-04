import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sarvamai"],
  // Older URLs (shared links, README) land somewhere sensible.
  async redirects() {
    return [
      { source: "/plan", has: [{ type: "query", key: "demo" }], destination: "/demo", permanent: false },
      { source: "/plan", destination: "/home", permanent: false },
      { source: "/plans/:path*", destination: "/home", permanent: false },
      ...["/language", "/guide"].map((source) => ({ source, destination: "/", permanent: false })),
      { source: "/reading", destination: "/scan", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
