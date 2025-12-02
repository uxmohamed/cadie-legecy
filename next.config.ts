import type { NextConfig } from "next";
import { withContentlayer } from "next-contentlayer2";
import path from "path";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages
  output: 'export',
  
  // Optimize images for Cloudflare
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true, // Required for static export
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable compression
  compress: true,

  // Optimize for production
  reactStrictMode: true,

  // Fix workspace root detection
  outputFileTracingRoot: process.cwd(),


  // Webpack configuration for Contentlayer
  webpack: (config, { isServer }) => {
    // Add alias for contentlayer/generated
    config.resolve.alias = {
      ...config.resolve.alias,
      'contentlayer/generated': path.join(process.cwd(), '.contentlayer/generated'),
    };
    return config;
  },
};

export default withContentlayer(nextConfig);
// export default nextConfig;
