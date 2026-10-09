import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  poweredByHeader: false,
  experimental: { proxyClientMaxBodySize: "21mb" },
};
export default nextConfig;
