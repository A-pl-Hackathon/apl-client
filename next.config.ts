import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
