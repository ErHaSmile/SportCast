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

# pnpm 下 node_modules/prisma 多为 symlink，必须解引用拷贝，否则发布包里 CLI 会断
copy_pkg() {
  local name="$1"
  local src="node_modules/$name"
  [[ -e "$src" ]] || return 0
  mkdir -p "$OUT/node_modules"
  rm -rf "$OUT/node_modules/$name"
  # -L: 跟随符号链接，拷成真实目录（兼容 pnpm）
  cp -aL "$src" "$OUT/node_modules/$name"
}

copy_pkg "prisma"
copy_pkg "@prisma"
# 生成后的 client（standalone 通常已有，缺则补）
if [[ -d node_modules/.prisma ]]; then
  rm -rf "$OUT/node_modules/.prisma"
  cp -aL node_modules/.prisma "$OUT/node_modules/.prisma"
fi

# 写一个不依赖 .bin symlink 的 prisma 入口
mkdir -p "$OUT/node_modules/.bin"
cat > "$OUT/node_modules/.bin/prisma" <<'EOF'
#!/usr/bin/env node
require('../prisma/build/index.js')
EOF
chmod +x "$OUT/node_modules/.bin/prisma"

# ali-oss 等 external 包：若 standalone 未带上则补齐
for pkg in ali-oss urllib proxy-agent; do
  if [[ -e "node_modules/$pkg" && ! -e "$OUT/node_modules/$pkg" ]]; then
    copy_pkg "$pkg"
  fi
done

mkdir -p "$OUT/logs" "$OUT/public/uploads/videos" "$OUT/prisma"
chmod +x "$OUT/deploy/"*.sh 2>/dev/null || true

if [[ ! -f "$OUT/node_modules/prisma/build/index.js" ]]; then
  echo "警告: 发布包内仍无 prisma CLI，启动时将跳过 migrate（可在构建目录先 migrate）"
else
  echo "==> prisma CLI 已打入发布包"
fi

echo "==> 发布目录就绪: $OUT"
echo "    入口: $OUT/server.js"
