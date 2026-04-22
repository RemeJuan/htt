import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const basePath = "/htt";

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: configDir,
  },
};

export default nextConfig;
