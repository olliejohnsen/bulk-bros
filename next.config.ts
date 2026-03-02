import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.tcgdex.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
