import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Self-contained server bundle for small Docker images.
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@smilecare/shared'],
};

export default nextConfig;
