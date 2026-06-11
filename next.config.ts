import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OneDrive-synced folder: avoid symlink-based optimizations
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
