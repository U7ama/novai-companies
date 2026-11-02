import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.BUILD_STANDALONE === 'true' ? '.next-lambda' : '.next',
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

export default nextConfig;
