import type { NextConfig } from "next";

const nextConfig: any = {
  // NOTE: firebase-admin is intentionally NOT listed in serverExternalPackages.
  // Under Turbopack (default in Next 16) the firebase-frameworks deploy adapter
  // turns externalized packages into hashed symlinks (e.g. firebase-admin-<hash>)
  // that do not survive into the deployed Cloud Function, causing
  // ERR_MODULE_NOT_FOUND at runtime (HTTP 500 on every route). Letting the
  // bundler include firebase-admin in the server chunks avoids that broken
  // external reference.
  serverExternalPackages: ['@opentelemetry/api'],
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
