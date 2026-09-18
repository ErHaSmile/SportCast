#!/usr/bin/env bash
# 停止服务
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if pm2 describe sportcast >/dev/null 2>&1; then
  pm2 stop sportcast
  echo "已停止 sportcast"
else
  echo "进程不存在，无需停止"
fi
