# 本机一键打包（Windows PowerShell）
# 用法：powershell -ExecutionPolicy Bypass -File .\deploy\pack.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Pkg = Join-Path $Root "package.json"
if (-not (Test-Path -LiteralPath $Pkg)) {
  throw "未找到 package.json，请在 sportcast 项目下执行"
}

$Out = Join-Path $env:USERPROFILE "Desktop\sportcast.tar.gz"
if (Test-Path -LiteralPath $Out) {
  Remove-Item -LiteralPath $Out -Force
}

Write-Host "==> 项目: $Root"
Write-Host "==> 输出: $Out"

Push-Location -LiteralPath $Root
try {
  & tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=.env --exclude=.env.local --exclude=prisma/dev.db --exclude=prisma/dev.db-journal --exclude=prisma/prod.db --exclude=prisma/prod.db-journal --exclude=public/uploads --exclude=logs -czf $Out .
  if ($LASTEXITCODE -ne 0) { throw "tar 失败，exit=$LASTEXITCODE" }
}
finally {
  Pop-Location
}

$Size = (Get-Item -LiteralPath $Out).Length
Write-Host ("==> 完成: {0:N1} MB" -f ($Size / 1MB))
Write-Host ""
Write-Host "下一步："
Write-Host "  1. scp 上传："
Write-Host ("     scp `"$Out`" root@你的服务器IP:/opt/")
Write-Host "  2. 服务器执行："
Write-Host "     bash /opt/sportcast/deploy/apply-upload.sh"
