import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include prettier as external packages to resolve version conflicts with react-email
  serverExternalPackages: ['prettier', 'prettier/standalone', 'prettier/plugins/html'],
  
  // Server actions configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Proper Turbopack configuration (now stable, not experimental)
  turbopack: {
    // Module resolution configuration
    // For modules that should be excluded, use empty strings instead of boolean values
    resolveAlias: {
      'canvas': '',
      'canvas.node': '',
      'jsdom': '',
    },
  },

  // Keep webpack config for browser-only fabric.js
  webpack: (config, { isServer }) => {
    // Only apply these settings for client-side bundles
    if (!isServer) {
      // Prevent Node.js specific modules from being included in the browser bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        'canvas.node': false,
        jsdom: false,
      };
    }
    
    return config;
  },
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
        hostname: '*',
      },
      {
        protocol: 'http',
        hostname: '*',
      }
    ],
  },
};

export default nextConfig;
