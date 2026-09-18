/**
 * PM2 — 发布包模式（本机构建产物，服务器解压即跑）
 * 入口为 Next.js standalone 的 server.js
 */
module.exports = {
  apps: [
    {
      name: "sportcast",
      cwd: __dirname + "/..",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
      },
      max_memory_restart: "800M",
      time: true,
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
    },
  ],
};
