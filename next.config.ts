import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode to prevent double-mounting and improve dev performance
  reactStrictMode: false,
  experimental: {
    cacheComponents: true, // Cache Components を有効化
    // reactCompiler: true, // React Compiler を有効化
  },
};

export default nextConfig;
