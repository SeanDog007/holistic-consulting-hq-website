import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: {
    "/library": ["./prisma/dev.db", "./data/brain/embeddings.json.gz"],
    "/library/[videoId]": ["./prisma/dev.db"],
    "/library/**": ["./prisma/dev.db", "./data/brain/embeddings.json.gz"],
    "/api/library/search": ["./prisma/dev.db", "./data/brain/embeddings.json.gz"],
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/residency", destination: "/programs", permanent: false },
      { source: "/launch", destination: "/programs#launch", permanent: false },
      { source: "/grow", destination: "/programs#grow", permanent: false },
      { source: "/master", destination: "/programs#master", permanent: false },
      { source: "/practitioner-stories", destination: "/results", permanent: false },
    ];
  },
  async rewrites() {
    return [{ source: "/", destination: "/index.html" }];
  },
  async headers() {
    return [
      {
        source: "/library",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/library/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
