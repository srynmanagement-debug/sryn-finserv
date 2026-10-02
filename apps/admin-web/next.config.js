/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sryn/types', '@sryn/config', '@sryn/validation', '@sryn/ui'],
};

module.exports = nextConfig;
