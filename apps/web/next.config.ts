import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Mock server: http://localhost:4040 (no /api/v1 prefix)
    // Real backend: http://localhost:8080/api/v1
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4040";

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
