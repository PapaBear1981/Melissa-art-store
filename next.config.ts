import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./src/sanity/image-loader.ts",
  },
  experimental: {
    serverActions: {
      // Commission requests can include up to 5 reference photos.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
