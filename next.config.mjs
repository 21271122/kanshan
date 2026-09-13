/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
