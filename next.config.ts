import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: {
    "/library": [
      "./prisma/dev.db",
      "./data/brain/embeddings.json.gz",
      "./data/brain/models/**",
      "./vendor/sharp-stub/**",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/onnxruntime_binding.node",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1.21.0",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_shared.so",
    ],
    "/library/[videoId]": ["./prisma/dev.db"],
    "/library/**": ["./prisma/dev.db", "./data/brain/embeddings.json.gz"],
    "/library/ask": [
      "./prisma/dev.db",
      "./data/brain/embeddings.json.gz",
      "./data/brain/models/**",
      "./vendor/sharp-stub/**",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/onnxruntime_binding.node",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1.21.0",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_shared.so",
    ],
    "/api/library/search": [
      "./prisma/dev.db",
      "./data/brain/embeddings.json.gz",
      "./data/brain/models/**",
      "./vendor/sharp-stub/**",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/onnxruntime_binding.node",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1.21.0",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_shared.so",
    ],
    "/api/brain/ask": [
      "./prisma/dev.db",
      "./data/brain/embeddings.json.gz",
      "./data/brain/models/**",
      "./vendor/sharp-stub/**",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/onnxruntime_binding.node",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1.21.0",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_shared.so",
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
    // This project serves only the recording library, at
    // library.holisticconsultinghq.com. It also carries a long-outdated copy of
    // the marketing site in public/ — left over from when this project briefly
    // held the apex domain. Every marketing path below now redirects to the
    // real marketing site so that stale copy is never served to anyone.
    const site = "https://holisticconsultinghq.com";
    const journal = "https://journal.holisticconsultinghq.com";
    const marketing = (from: string, to: string) => ({
      source: from,
      destination: to,
      permanent: false,
    });

    return [
      marketing("/index.html", site),
      marketing("/home.html", site),
      marketing("/about.html", `${site}/about`),
      marketing("/programs.html", `${site}/programs`),
      marketing("/results.html", `${site}/results`),
      marketing("/enroll.html", `${site}/enroll`),
      marketing("/faq.html", `${site}/programs`),
      marketing("/blog.html", journal),

      // pretty-URL forms of the same pages
      marketing("/about", `${site}/about`),
      marketing("/programs", `${site}/programs`),
      marketing("/results", `${site}/results`),
      marketing("/enroll", `${site}/enroll`),
      marketing("/faq", `${site}/programs`),
      marketing("/blog", journal),

      // legacy aliases. LAUNCH/GROW/MASTER were retired in the July 2026
      // restructure, so these land on /programs rather than dead anchors.
      marketing("/residency", `${site}/programs`),
      marketing("/launch", `${site}/programs`),
      marketing("/grow", `${site}/programs`),
      marketing("/master", `${site}/programs`),
      marketing("/practitioner-stories", `${site}/results`),
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
