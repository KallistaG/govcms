/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@govcms/ui', '@govcms/database'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
