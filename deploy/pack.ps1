# 本机一键打包（Windows PowerShell）
# 用法：在项目根目录执行  .\deploy\pack.ps1
# 或：  powershell -ExecutionPolicy Bypass -File .\deploy\pack.ps1
# 生成桌面上的 sportcast.tar.gz（不含 node_modules / .next / .env / 本地库）

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root "package.json"))) {
  Write-Error "未找到 package.json，请在 sportcast 项目下执行"
}

$Out = Join-Path $env:USERPROFILE "Desktop\sportcast.tar.gz"
if (Test-Path $Out) { Remove-Item $Out -Force }

Write-Host "==> 项目: $Root"
Write-Host "==> 输出: $Out"

Push-Location $Root
try {
  # 排除体积大的本地产物与密钥；服务器上会重新 pnpm install / build
  tar --exclude=node_modules `
      --exclude=.next `
      --exclude=.git `
      --exclude=.env `
      --exclude=.env.local `
      --exclude=prisma/dev.db `
      --exclude=prisma/dev.db-journal `
      --exclude=prisma/prod.db `
      --exclude=prisma/prod.db-journal `
      --exclude=public/uploads `
      --exclude=logs `
      -czf $Out .
} finally {
  Pop-Location
}

$Size = (Get-Item $Out).Length
Write-Host ("==> 完成: {0:N1} MB" -f ($Size / 1MB))
Write-Host ""
Write-Host "下一步："
Write-Host "  1. scp 上传到服务器 /opt/："
Write-Host "     scp `"$Out`" root@你的服务器IP:/opt/"
Write-Host "  2. 服务器执行："
Write-Host "     cd /opt && tar -xzf sportcast.tar.gz -C /opt/sportcast"
Write-Host "     cd /opt/sportcast && sed -i 's/\r`$//' deploy/*.sh && bash deploy/up.sh"
