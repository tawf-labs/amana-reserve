/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@amana/sdk'],
  experimental: {
    serverComponentsExternalPackages: ['@project-serum/anchor'],
  },
};

module.exports = nextConfig;
