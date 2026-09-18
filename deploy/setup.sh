#!/usr/bin/env bash
# 首次/本地安装：依赖、数据库、构建（不含 git pull、不启动）
# 用法：bash deploy/setup.sh
# 日常发版请用：bash deploy/up.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 工作目录: $ROOT"

if [[ ! -f .env ]]; then
  echo "未找到 .env，正在从示例复制..."
  cp deploy/env.production.example .env
  echo "请编辑 .env，至少修改 AUTH_SECRET（以及 OSS 配置）后再继续："
  echo "  nano $ROOT/.env"
  exit 1
fi

mkdir -p logs public/uploads/videos prisma

echo "==> 安装依赖..."
if ! command -v pnpm >/dev/null 2>&1; then
  echo "==> 安装 pnpm..."
  if command -v corepack >/dev/null 2>&1; then
    corepack enable >/dev/null 2>&1 || true
    corepack prepare pnpm@12.4.1 --activate || npm install -g pnpm
  else
    npm install -g pnpm
  fi
fi

if command -v pnpm >/dev/null 2>&1 && [[ -f pnpm-lock.yaml ]]; then
  pnpm install --frozen-lockfile
elif [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> Prisma generate + migrate..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm exec prisma generate
  pnpm exec prisma migrate deploy
else
  npx prisma generate
  npx prisma migrate deploy
fi

read -r -p "是否写入初始管理员与示例数据？(y/N) " SEED_ANS || true
if [[ "${SEED_ANS:-}" =~ ^[Yy]$ ]]; then
  if command -v pnpm >/dev/null 2>&1; then
    pnpm db:seed
  else
    npm run db:seed
  fi
fi

echo "==> 生产构建..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm build
else
  npm run build
fi

echo ""
echo "==> setup 完成。"
echo "启动服务：bash deploy/start.sh"
echo "以后日常更新：bash deploy/up.sh"
