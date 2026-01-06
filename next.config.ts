import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  turbopack: {}, // Explicitly enable turbopack
};

export default nextConfig;
