import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: {
    "/library": [
      "./prisma/dev.db",
      "./data/brain/embeddings.json.gz",
      "./data/brain/models/**",
      "./vendor/sharp-stub/**",
    ],
    "/library/[videoId]": ["./prisma/dev.db"],
    "/library/**": ["./prisma/dev.db", "./data/brain/embeddings.json.gz"],
    "/library/ask": [
      "./prisma/dev.db",
      "./data/brain/embeddings.json.gz",
      "./data/brain/models/**",
      "./vendor/sharp-stub/**",
    ],
    "/api/library/search": [
      "./prisma/dev.db",
      "./data/brain/embeddings.json.gz",
      "./data/brain/models/**",
      "./vendor/sharp-stub/**",
    ],
    "/api/brain/ask": [
      "./prisma/dev.db",
      "./data/brain/embeddings.json.gz",
      "./data/brain/models/**",
      "./vendor/sharp-stub/**",
    ],
  },
  outputFileTracingExcludes: {
    "*": [
      "./data/brain/search_chunks.json.gz",
      "./data/brain/videos.json",
      "./docs/**",
      "./scripts/**",
      "./public/**",
      "./node_modules/sharp/**",
      "./node_modules/@img/**",
      "./node_modules/**/sharp/**",
      "./node_modules/**/@img/**",
      "./node_modules/@huggingface/transformers/node_modules/sharp/**",
      "./node_modules/@huggingface/transformers/node_modules/@img/**",
      // onnxruntime-node ships CUDA/TensorRT + every OS (~536MB). Functions only
      // need the linux x64 CPU binding.
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_cuda.so",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_tensorrt.so",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/arm64/**",
      "./node_modules/onnxruntime-node/bin/napi-v3/darwin/**",
      "./node_modules/onnxruntime-node/bin/napi-v3/win32/**",
      "./node_modules/onnxruntime-web/**",
    ],
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
