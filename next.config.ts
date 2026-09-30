import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['sharp'],
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/@img/**/*',
      './node_modules/sharp/**/*',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      // If a custom CDN domain is configured in R2_PUBLIC_URL, allow wildcard https
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
