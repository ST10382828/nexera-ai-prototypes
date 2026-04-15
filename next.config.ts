import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.tripo3d.ai",
      },
    ],
  },
};

export default nextConfig;
