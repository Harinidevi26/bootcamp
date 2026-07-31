import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Google profile photos served via Firebase Auth
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        // Product images from Unsplash
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
