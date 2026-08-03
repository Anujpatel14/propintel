import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // src/instrumentation.ts registers uncaughtException / unhandledRejection loggers
  async redirects() {
    return [
      {
        source: '/dashboard/analyzer',
        destination: '/dashboard/analyze',
        permanent: false,
      },
      {
        source: '/dashboard/calculators',
        destination: '/dashboard/analyze',
        permanent: false,
      },
      {
        source: '/dashboard/calculators/hold',
        destination: '/dashboard/analyze/hold',
        permanent: false,
      },
      {
        source: '/dashboard/calculators/flip',
        destination: '/dashboard/analyze/flip',
        permanent: false,
      },
      {
        source: '/dashboard/calculators/rental',
        destination: '/dashboard/analyze/rental',
        permanent: false,
      },
      {
        source: '/dashboard/compare',
        destination: '/dashboard/deals/compare',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
