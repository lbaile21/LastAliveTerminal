import type { NextConfig } from 'next';

const config: NextConfig = {
  // The workspace packages ship raw TypeScript from src/; Next must transpile
  // them rather than expecting pre-built output.
  transpilePackages: ['@last-alive/ai', '@last-alive/engine', '@last-alive/shared'],
};

export default config;
