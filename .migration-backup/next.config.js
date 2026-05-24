/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.externals.push({
      ws: "ws"
    });
    return config;
  }
};

export default nextConfig;
