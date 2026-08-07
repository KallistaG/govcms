/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@govcms/ui', '@govcms/database'],
  reactStrictMode: true,
};

module.exports = nextConfig;
