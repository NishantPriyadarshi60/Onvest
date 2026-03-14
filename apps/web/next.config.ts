import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@onvest/types", "@onvest/config", "@onvest/db", "@onvest/email"],
};

export default nextConfig;
