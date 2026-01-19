import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "slelguoygbfzlpylpxfs.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "slelguoygbfzlpylpxfs.supabase.co",
        pathname: "/storage/v1/render/image/public/**",
      },
      {
        protocol: "https",
        hostname: "media.weavy.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "app.weavy.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "*.transloadit.com",
        pathname: "/**"
      }
    ],
  },
};

export default nextConfig;