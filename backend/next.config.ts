import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@stagelink/shared"],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@stagelink/shared": path.resolve(__dirname, "../shared"),
    };
    return config;
  },
};

export default nextConfig;
