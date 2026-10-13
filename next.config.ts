import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/penguise/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source:
          "/penguise/StreamingAssets/UnityServicesProjectConfiguration.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate, no-transform",
          },
        ],
      },
      ...[
        ["data", "application/octet-stream"],
        ["framework.js", "application/javascript"],
        ["wasm", "application/wasm"],
      ].map(([extension, contentType]) => ({
        source: `/penguise/Build/penguise.${extension}.br`,
        headers: [
          { key: "Content-Encoding", value: "br" },
          { key: "Content-Type", value: contentType },
        ],
      })),
    ]
  },
}

export default nextConfig
