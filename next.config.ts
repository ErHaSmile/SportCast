import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 产出可独立运行的发布包（类似 jar）：服务器无需 pnpm install / next build
  output: "standalone",
  // Allow opening via 127.0.0.1 / LAN IP during local development
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.3.244"],
  // 隐藏左下角 Next.js 开发调试浮层（N 图标）
  devIndicators: false,
  // ali-oss 及其原生依赖不打进 Turbopack 包，避免 proxy-agent 解析失败
  serverExternalPackages: ["ali-oss", "urllib", "proxy-agent"],
  // 允许后台上传较大回放视频
  experimental: {
    proxyClientMaxBodySize: "1100mb",
  },
};

export default nextConfig;
