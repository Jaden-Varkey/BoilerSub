import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ["app"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    externalDir: true,
  },
  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /src\/next-server\/http\.js$/,
        path.resolve(process.cwd(), "app/src/next-server/http.ts"),
      ),
      new webpack.NormalModuleReplacementPlugin(
        /src\/next-server\/v1\.js$/,
        path.resolve(process.cwd(), "app/src/next-server/v1.ts"),
      ),
    );

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
