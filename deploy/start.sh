#!/usr/bin/env bash
# 启动服务（PM2）
# 用法：bash deploy/start.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .next ]]; then
  echo "未找到 .next 构建产物，请先执行：bash deploy/setup.sh"
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
echo "后台: /admin   默认账号 admin / admin123"
echo "开机自启请执行: pm2 startup   （按提示再跑一条 sudo 命令）"
