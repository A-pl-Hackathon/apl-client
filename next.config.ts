import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  poweredByHeader: false,

  experimental: {
    serverComponentsExternalPackages: ["sql.js"],
  },

  async rewrites() {
    return [
      {
        source: "/api/user-data/:path*",
        destination: "https://api-dashboard.a-pl.xyz/user-data/:path*",
      },
    ];
  },

  headers: async () => {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
