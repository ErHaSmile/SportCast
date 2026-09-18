#!/usr/bin/env bash
# 解压本机上传的发布包并直接启动（不在服务器下依赖 / 构建）
# 用法：
#   1. 本机 pack.ps1 → 得到桌面 sportcast-release.tar.gz
#   2. scp 到 /opt/sportcast-release.tar.gz
#   3. bash /opt/sportcast/deploy/apply-upload.sh
#      或：bash deploy/apply-upload.sh /opt/sportcast-release.tar.gz
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE="${1:-}"

if [[ -z "$ARCHIVE" ]]; then
  for c in /opt/sportcast-release.tar.gz /opt/sportcast.tar.gz "$ROOT/../sportcast-release.tar.gz"; do
    if [[ -f "$c" ]]; then ARCHIVE="$c"; break; fi
  done
fi

if [[ -z "${ARCHIVE}" || ! -f "$ARCHIVE" ]]; then
  echo "找不到压缩包。请先上传 sportcast-release.tar.gz 到 /opt/"
  exit 1
fi

echo "==> 解压 $ARCHIVE → $ROOT"
mkdir -p "$ROOT"

# 保留服务器上的密钥与数据
KEEP_ENV=0
KEEP_DB=0
[[ -f "$ROOT/.env" ]] && KEEP_ENV=1 && cp -a "$ROOT/.env" /tmp/sportcast.env.bak
[[ -f "$ROOT/prisma/prod.db" ]] && KEEP_DB=1 && cp -a "$ROOT/prisma/prod.db" /tmp/sportcast.prod.db.bak
[[ -d "$ROOT/public/uploads" ]] && cp -a "$ROOT/public/uploads" /tmp/sportcast.uploads.bak || true

tar -xzf "$ARCHIVE" -C "$ROOT"

# 若包内多套一层 release/ 或 sportcast/
if [[ ! -f "$ROOT/server.js" && -f "$ROOT/release/server.js" ]]; then
  shopt -s dotglob
  mv "$ROOT"/release/* "$ROOT"/
  rmdir "$ROOT/release" 2>/dev/null || true
fi

[[ "$KEEP_ENV" == "1" ]] && cp -a /tmp/sportcast.env.bak "$ROOT/.env"
[[ "$KEEP_DB" == "1" ]] && mkdir -p "$ROOT/prisma" && cp -a /tmp/sportcast.prod.db.bak "$ROOT/prisma/prod.db"
[[ -d /tmp/sportcast.uploads.bak ]] && mkdir -p "$ROOT/public" && rm -rf "$ROOT/public/uploads" && mv /tmp/sportcast.uploads.bak "$ROOT/public/uploads"

cd "$ROOT"
sed -i 's/\r$//' deploy/*.sh 2>/dev/null || true
chmod +x deploy/*.sh 2>/dev/null || true

if [[ -f server.js ]]; then
  echo "==> 检测到发布包，直接启动..."
  bash deploy/start-release.sh
else
  echo "==> 检测到源码包，将在服务器安装依赖并构建（较慢）..."
  bash deploy/up.sh
fi
