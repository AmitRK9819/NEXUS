import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "deck.gl",
    "@deck.gl/core",
    "@deck.gl/layers",
    "@deck.gl/react",
    "@deck.gl/aggregation-layers",
    "@deck.gl/geo-layers",
    "@luma.gl/core",
    "@luma.gl/webgl",
    "@luma.gl/engine",
    "@luma.gl/shadertools",
    "react-map-gl",
  ],
};

export default nextConfig;
