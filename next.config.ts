import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    disableOptimizedLoading: true,
  },
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
