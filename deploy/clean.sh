#!/usr/bin/env bash
# 清理服务器上旧依赖 / 构建缓存（切换到发布包模式后可释放磁盘）
# 用法：bash deploy/clean.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> clean $ROOT"
# 发布包模式以 server.js 为准；源码模式下的 node_modules/.next 可删
if [[ -f server.js ]]; then
  echo "  release mode: keep server.js + node_modules (runtime)"
  rm -rf .next/cache 2>/dev/null || true
else
  echo "  remove node_modules / .next (will need reinstall)"
  rm -rf node_modules .next release out
fi
rm -rf logs/*.log 2>/dev/null || true
echo "==> done"
