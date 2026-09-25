import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./src/sanity/image-loader.ts",
  },
  // Collections now live inside the Gallery; keep old links working.
  async redirects() {
    return [
      { source: "/collections", destination: "/gallery#collections", permanent: true },
      { source: "/collections/:slug", destination: "/gallery/:slug", permanent: true },
    ];
  },
  experimental: {
    serverActions: {
      // Commission requests can include up to 5 reference photos.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
