import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: false,
  async redirects() {
    return [];
  },
};

export default nextConfig;
