import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize images for Cloudflare
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable compression
  compress: true,

  // Optimize for production
  reactStrictMode: true,
};

export default nextConfig;
