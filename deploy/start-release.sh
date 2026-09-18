#!/usr/bin/env bash
# 发布包启动：解压后直接跑，不在服务器 pnpm install / next build
# 用法：bash deploy/start-release.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f server.js ]]; then
  echo "未找到 server.js，当前目录不是「发布包」。"
  echo "请使用本机 deploy/pack.ps1 打出的 sportcast-release.tar.gz 解压到本目录。"
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "缺少 .env。请先配置："
  echo "  cp deploy/env.production.example .env && nano .env"
  exit 1
fi

mkdir -p logs public/uploads/videos prisma

run_prisma() {
  if [[ -f node_modules/prisma/build/index.js ]]; then
    node node_modules/prisma/build/index.js "$@"
    return $?
  fi
  if [[ -x node_modules/.bin/prisma ]]; then
    ./node_modules/.bin/prisma "$@"
    return $?
  fi
  return 127
}

# 数据库迁移（发布包内含 prisma CLI；失败不阻断启动——部署脚本会在构建目录先 migrate）
if [[ -f node_modules/prisma/build/index.js ]]; then
  echo "==> prisma migrate deploy..."
  if ! run_prisma migrate deploy; then
    echo "==> 警告: 发布包内 migrate 失败（若构建阶段已 migrate 可忽略）"
  fi
else
  echo "==> 警告: 发布包内无可用 prisma CLI，跳过迁移（请确认库表已就绪）"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> 安装 pm2..."
  npm install -g pm2
fi

echo "==> 启动 / 重启..."
if pm2 describe sportcast >/dev/null 2>&1; then
  pm2 delete sportcast >/dev/null 2>&1 || true
fi
pm2 start deploy/ecosystem.release.cjs --update-env
pm2 save

echo ""
pm2 status
echo ""
echo "前台: http://服务器IP/"
echo "后台: http://服务器IP/admin"
curl -sI http://127.0.0.1:3000 | head -n 1 || true
