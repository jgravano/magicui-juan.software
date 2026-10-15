import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [{
        source: "/",
        has: [{ type: "host", value: "studio.juan.software" }],
        destination: "/studio",
      }],
    };
  },
};

export default nextConfig;
