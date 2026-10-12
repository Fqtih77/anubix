import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NETLIFY ? undefined : "standalone",
  env: { NEXT_PUBLIC_FILE_MAX_MB: process.env.NETLIFY ? "4" : "10" },
};

export default nextConfig;
