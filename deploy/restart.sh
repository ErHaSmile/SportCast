#!/usr/bin/env bash
# 重启服务
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p logs
if pm2 describe sportcast >/dev/null 2>&1; then
  pm2 restart sportcast --update-env
else
  pm2 start deploy/ecosystem.config.cjs
fi
pm2 status
