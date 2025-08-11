import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Skip ESLint during production builds to avoid CI blocking on stylistic issues
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_AWS_REGION: process.env.AWS_REGION,
    NEXT_PUBLIC_AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  },
  webpack: (config, { isServer }) => {
    // Handle Node.js modules that can't run in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        module: false,
      };
    }
    return config;
  },
};

export default nextConfig;
