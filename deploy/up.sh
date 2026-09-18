#!/usr/bin/env bash
# 一键发版（默认：不拉 Git，适用于本机打包上传后的更新）
# 用法（在 /opt/sportcast）：
#   bash deploy/up.sh
# 若要用 git pull：USE_GIT=1 bash deploy/up.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 工作目录: $ROOT"

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    return 0
  fi
  echo "==> 未检测到 pnpm，正在安装..."
  if command -v corepack >/dev/null 2>&1; then
    corepack enable >/dev/null 2>&1 || true
    corepack prepare pnpm@12.4.1 --activate
  else
    npm install -g pnpm
  fi
  command -v pnpm >/dev/null 2>&1 || {
    echo "pnpm 安装失败，请手动执行: npm install -g pnpm"
    exit 1
  }
}

run_app() {
  if command -v pnpm >/dev/null 2>&1 && [[ -f pnpm-lock.yaml ]]; then
    pnpm "$@"
  else
    npm run "$@"
  fi
}

install_deps() {
  echo "==> 安装依赖..."
  if command -v pnpm >/dev/null 2>&1 && [[ -f pnpm-lock.yaml ]]; then
    pnpm install --frozen-lockfile
  elif [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
}

# 兼容旧参数 SKIP_GIT=1；默认跳过 git（国内 ECS 常连不上 GitHub）
if [[ "${USE_GIT:-0}" == "1" ]] && [[ "${SKIP_GIT:-0}" != "1" ]] && [[ -d .git ]]; then
  echo "==> 拉取最新代码 (USE_GIT=1)..."
  git fetch --all --prune
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  git pull --ff-only origin "$BRANCH" || git pull --ff-only
  echo "==> 当前版本: $(git log -1 --oneline)"
else
  echo "==> 跳过 git pull（默认使用本机打包上传的代码）"
fi

if [[ ! -f .env ]]; then
  echo ""
  echo "缺少 .env。请先配置生产环境："
  echo "  cp deploy/env.production.example .env"
  echo "  nano .env   # 填写 AUTH_SECRET、OSS_* 等"
  exit 1
fi

mkdir -p logs public/uploads/videos prisma

# 去掉 Windows 换行，避免脚本异常
if command -v sed >/dev/null 2>&1; then
  sed -i 's/\r$//' deploy/*.sh 2>/dev/null || true
fi

ensure_pnpm
install_deps

echo "==> 数据库 generate + migrate..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm exec prisma generate
  pnpm exec prisma migrate deploy
else
  npx prisma generate
  npx prisma migrate deploy
fi

echo "==> 生产构建..."
run_app build

echo "==> 启动 / 重启 PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
  echo "未找到 pm2，正在安装..."
  npm install -g pm2
fi

if pm2 describe sportcast >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.cjs --update-env
else
  pm2 start deploy/ecosystem.config.cjs
fi
pm2 save

echo ""
echo "==> 完成"
pm2 status
echo ""
echo "前台: http://服务器IP/"
echo "后台: http://服务器IP/admin"
echo "只改 .env 未改代码时，也可: pm2 restart sportcast --update-env"
