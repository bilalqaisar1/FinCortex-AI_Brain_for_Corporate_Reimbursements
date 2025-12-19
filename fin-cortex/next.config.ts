import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dczlyrrkjnxbmqkbgtgz.supabase.co",
      },
    ],
  },
};

export default nextConfig;
