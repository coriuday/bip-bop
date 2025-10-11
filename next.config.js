/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => {
    return 'my-build-id';
  },
};

module.exports = nextConfig;