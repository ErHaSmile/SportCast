#!/usr/bin/env bash
# 把 next build 的 standalone 组装成可解压即跑的发布目录
# 用法（在项目根，已执行过 pnpm build）：
#   bash deploy/assemble-release.sh [输出目录]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/release}"
cd "$ROOT"

if [[ ! -f .next/standalone/server.js ]]; then
  echo "缺少 .next/standalone。请先: pnpm build"
  exit 1
fi

echo "==> 组装发布目录: $OUT"
rm -rf "$OUT"
mkdir -p "$OUT"

cp -a .next/standalone/. "$OUT/"
mkdir -p "$OUT/.next"
cp -a .next/static "$OUT/.next/static"
cp -a public "$OUT/public"

# 数据库迁移与 schema
mkdir -p "$OUT/prisma"
cp -a prisma/schema.prisma "$OUT/prisma/"
cp -a prisma/migrations "$OUT/prisma/"
cp -a deploy "$OUT/deploy"
cp -a deploy/env.production.example "$OUT/deploy/" 2>/dev/null || true
[[ -f .npmrc ]] && cp -a .npmrc "$OUT/" || true

# 确保 prisma CLI 在发布包内（migrate 用）
if [[ ! -d "$OUT/node_modules/prisma" && -d node_modules/prisma ]]; then
  mkdir -p "$OUT/node_modules"
  cp -a node_modules/prisma "$OUT/node_modules/"
  cp -a node_modules/.bin "$OUT/node_modules/" 2>/dev/null || true
fi
# prisma engines
if [[ -d node_modules/@prisma ]] && [[ ! -d "$OUT/node_modules/@prisma" ]]; then
  mkdir -p "$OUT/node_modules"
  cp -a node_modules/@prisma "$OUT/node_modules/"
fi

# ali-oss 等 external 包：若 standalone 未带上则补齐
for pkg in ali-oss urllib proxy-agent; do
  if [[ -d "node_modules/$pkg" && ! -d "$OUT/node_modules/$pkg" ]]; then
    # pnpm 结构可能在 .pnpm 下，尽力从根 symlink 目标拷贝
    real=""
    if [[ -L "node_modules/$pkg" ]]; then
      real="$(readlink -f "node_modules/$pkg" 2>/dev/null || readlink "node_modules/$pkg")"
    elif [[ -d "node_modules/$pkg" ]]; then
      real="node_modules/$pkg"
    fi
    if [[ -n "$real" && -d "$real" ]]; then
      mkdir -p "$OUT/node_modules"
      cp -a "$real" "$OUT/node_modules/$pkg"
    fi
  fi
done

mkdir -p "$OUT/logs" "$OUT/public/uploads/videos" "$OUT/prisma"
chmod +x "$OUT/deploy/"*.sh 2>/dev/null || true

echo "==> 发布目录就绪: $OUT"
echo "    入口: $OUT/server.js"
