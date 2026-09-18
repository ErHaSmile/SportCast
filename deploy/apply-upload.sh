#!/usr/bin/env bash
# 解压刚上传的 sportcast.tar.gz 并一键构建启动
# 用法：
#   1. 本机 pack.ps1 打包后 scp 到 /opt/sportcast.tar.gz
#   2. bash /opt/sportcast/deploy/apply-upload.sh
#   或： bash deploy/apply-upload.sh /opt/sportcast.tar.gz
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE="${1:-/opt/sportcast.tar.gz}"

if [[ ! -f "$ARCHIVE" ]]; then
  echo "找不到压缩包: $ARCHIVE"
  echo "请先把 sportcast.tar.gz 上传到服务器，例如 /opt/sportcast.tar.gz"
  exit 1
fi

echo "==> 解压 $ARCHIVE → $ROOT"
mkdir -p "$ROOT"
tar -xzf "$ARCHIVE" -C "$ROOT"

cd "$ROOT"
sed -i 's/\r$//' deploy/*.sh 2>/dev/null || true
chmod +x deploy/*.sh 2>/dev/null || true

echo "==> 开始构建并启动..."
bash deploy/up.sh
