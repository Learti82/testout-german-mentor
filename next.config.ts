import type { NextConfig } from "next";

// Fully static site: no server, no database, no API keys.
// `npm run build` writes the site to ./out (host it anywhere for free, or run `npm start`).
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
