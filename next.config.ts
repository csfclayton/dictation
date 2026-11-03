import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/dictation",
  assetPrefix: "/dictation",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
