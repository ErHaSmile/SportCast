#!/usr/bin/env bash
# 首次/本地安装：依赖、数据库、构建
# 用法：bash deploy/setup.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 工作目录: $ROOT"

if [[ ! -f .env ]]; then
  echo "未找到 .env，正在从示例复制..."
  cp deploy/env.production.example .env
  echo "请编辑 .env，至少修改 AUTH_SECRET 后再继续："
  echo "  nano $ROOT/.env"
  exit 1
fi

mkdir -p logs public/uploads/videos prisma

echo "==> 安装依赖..."
if command -v pnpm >/dev/null 2>&1 && [[ -f pnpm-lock.yaml ]]; then
  pnpm install --frozen-lockfile
elif [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> Prisma generate + migrate..."
npx prisma generate
npx prisma migrate deploy

read -r -p "是否写入初始管理员与示例数据？(y/N) " SEED_ANS || true
if [[ "${SEED_ANS:-}" =~ ^[Yy]$ ]]; then
  npm run db:seed
fi

echo "==> 生产构建..."
npm run build

echo ""
echo "==> setup 完成。启动：bash deploy/start.sh"
