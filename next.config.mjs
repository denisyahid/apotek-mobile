/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prototype berjalan sepenuhnya di client (LocalStorage) — tidak ada tulisan ke
  // filesystem server, aman untuk Vercel serverless.
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
