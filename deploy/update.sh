#!/usr/bin/env bash
# 发版更新：拉代码 → 依赖 → 迁移 → 构建 → 平滑重启
# 用法：bash deploy/update.sh
# 环境变量 SKIP_GIT=1 可跳过 git pull
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 更新目录: $ROOT"

if [[ "${SKIP_GIT:-0}" != "1" ]] && [[ -d .git ]]; then
  echo "==> git pull..."
  git pull --ff-only
else
  echo "==> 跳过 git pull（无仓库或 SKIP_GIT=1）"
fi

if [[ ! -f .env ]]; then
  echo "缺少 .env，请先配置"
  exit 1
fi

mkdir -p logs public/uploads/videos

echo "==> 安装依赖..."
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> 数据库迁移..."
npx prisma generate
npx prisma migrate deploy

echo "==> 构建..."
npm run build

echo "==> 重启进程..."
if pm2 describe sportcast >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.cjs --update-env
else
  pm2 start deploy/ecosystem.config.cjs
fi
pm2 save

echo ""
echo "==> 更新完成"
pm2 status
