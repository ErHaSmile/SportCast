#!/usr/bin/env bash
# 兼容旧命令名：等同于 deploy/up.sh
exec bash "$(cd "$(dirname "$0")" && pwd)/up.sh" "$@"
