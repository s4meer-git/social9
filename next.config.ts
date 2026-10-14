import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: every tool runs in the browser, no server needed.
  output: "export",
  devIndicators: false,
};

export default nextConfig;
