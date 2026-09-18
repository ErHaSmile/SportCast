#!/usr/bin/env bash
# 启动服务（PM2）— 自动识别发布包 / 源码包
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f server.js ]]; then
  exec bash deploy/start-release.sh
fi

if [[ ! -d .next ]]; then
  echo "未找到 .next 构建产物，请先执行：bash deploy/up.sh"
  echo "或上传本机 pack.ps1 -Server 打出的发布包。"
  exit 1
fi

mkdir -p logs public/uploads/videos

if pm2 describe sportcast >/dev/null 2>&1; then
  echo "==> 已存在进程，执行 reload..."
  pm2 reload deploy/ecosystem.config.cjs --update-env
else
  echo "==> 首次启动..."
  pm2 start deploy/ecosystem.config.cjs
fi

pm2 save
echo ""
pm2 status
echo ""
echo "访问: http://服务器IP/  （配置 Nginx 后）或 http://127.0.0.1:3000"
echo "后台: /admin"
