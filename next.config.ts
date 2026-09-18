import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: {
    "/library": ["./prisma/dev.db", "./data/brain/embeddings.json.gz", "./data/brain/models/**"],
    "/library/[videoId]": ["./prisma/dev.db"],
    "/library/**": ["./prisma/dev.db", "./data/brain/embeddings.json.gz", "./data/brain/models/**"],
    "/library/ask": ["./prisma/dev.db", "./data/brain/embeddings.json.gz", "./data/brain/models/**"],
    "/api/library/search": ["./prisma/dev.db", "./data/brain/embeddings.json.gz", "./data/brain/models/**"],
    "/api/brain/ask": ["./prisma/dev.db", "./data/brain/embeddings.json.gz", "./data/brain/models/**"],
  },
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "@huggingface/transformers",
    "onnxruntime-node",
    "onnxruntime-web",
  ],
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
    return [
      { source: "/", destination: "/index.html" },
      { source: "/programs", destination: "/programs.html" },
      { source: "/results", destination: "/results.html" },
    ];
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
      {
        source: "/api/brain/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
