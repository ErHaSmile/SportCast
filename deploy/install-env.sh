#!/usr/bin/env bash
# 安装运行环境：Node.js 20、PM2、Nginx、基础工具
# 用法：sudo bash deploy/install-env.sh
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "请使用 root 或 sudo 执行：sudo bash deploy/install-env.sh"
  exit 1
fi

echo "==> 检测系统..."
if [[ -f /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  OS_ID="${ID:-unknown}"
else
  OS_ID="unknown"
fi
echo "系统: ${OS_ID}"

install_debian() {
  apt-get update -y
  apt-get install -y curl ca-certificates gnupg git build-essential nginx
  if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
}

install_rhel() {
  yum install -y curl ca-certificates git gcc-c++ make nginx || dnf install -y curl ca-certificates git gcc-c++ make nginx
  if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 20 ]]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs || dnf install -y nodejs
  fi
}

case "${OS_ID}" in
  ubuntu|debian)
    install_debian
    ;;
  centos|rhel|alinux|alibaba|anolis|rocky|almalinux|amzn)
    install_rhel
    ;;
  *)
    echo "未识别发行版，请手动安装 Node.js 20+、git、nginx"
    exit 1
    ;;
esac

npm install -g pm2

echo ""
echo "==> 安装完成"
echo "node: $(node -v)"
echo "npm:  $(npm -v)"
echo "pm2:  $(pm2 -v)"
echo "nginx: $(nginx -v 2>&1 || true)"
echo ""
echo "下一步："
echo "  1. 配置 .env：cp deploy/env.production.example .env"
echo "  2. bash deploy/setup.sh"
echo "  3. bash deploy/start.sh"
