import type { NextConfig } from "next";

const nextConfig: any = {
  serverExternalPackages: ['firebase-admin', '@opentelemetry/api'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'cdn1.telesco.pe' },
      { protocol: 'https', hostname: 'cdn2.telesco.pe' },
      { protocol: 'https', hostname: 'cdn3.telesco.pe' },
      { protocol: 'https', hostname: 'cdn4.telesco.pe' },
      { protocol: 'https', hostname: 'cdn5.telesco.pe' },
      { protocol: 'https', hostname: 'telegra.ph' },
      { protocol: 'https', hostname: '*.telegram.org' }
    ],
  },
};

export default nextConfig;
