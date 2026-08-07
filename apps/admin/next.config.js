/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@govcms/ui', '@govcms/database'],
  reactStrictMode: true,
  experimental: {
    // Next.js 15 options
  },
};

module.exports = nextConfig;
