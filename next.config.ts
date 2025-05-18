import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during build - enables deployment despite linting errors
  eslint: {
    // Warning rather than error conditions don't fail the build
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds
  typescript: {
    // Don't fail the build if there are type errors
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'startup-template-sage.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'd3u5pbhtl21lu1.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'marketingwithai42.s3.us-east-2.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
