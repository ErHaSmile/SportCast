#!/usr/bin/env bash
# 查看运行状态
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==== PM2 ===="
pm2 status || true
echo ""
echo "==== 最近日志 ===="
pm2 logs sportcast --lines 40 --nostream || true
echo ""
echo "==== 本地探活 ===="
curl -sI "http://127.0.0.1:3000" | head -n 5 || echo "无法连接 127.0.0.1:3000"
echo ""
echo "==== 磁盘（上传目录）===="
du -sh public/uploads 2>/dev/null || echo "uploads 目录尚未创建"
df -h . | tail -n 1
