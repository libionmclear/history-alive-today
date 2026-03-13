import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'historyalivetoday.com',
      },
    ],
  },
};

export default nextConfig;
