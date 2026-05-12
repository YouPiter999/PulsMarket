import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin', '@opentelemetry/api'],
};

export default nextConfig;
