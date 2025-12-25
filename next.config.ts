import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Disable React Strict Mode to prevent double-mounting and improve dev performance
  reactStrictMode: false,
  cacheComponents: true, // Cache Components を有効化
  // reactCompiler: true, // React Compiler を無効化、three.jsの描画のため
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
