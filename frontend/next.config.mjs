/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.pexels.com" },
      { protocol: "https", hostname: "**.terra.com" },
      { protocol: "https", hostname: "**.trrsf.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
