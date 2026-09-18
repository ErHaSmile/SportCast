/**
 * PM2 进程配置 — 赛播云 SportCast
 * 用法：pm2 start deploy/ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "sportcast",
      cwd: __dirname + "/..",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
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
