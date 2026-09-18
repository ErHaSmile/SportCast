# One-click pack for Windows PowerShell
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy\pack.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Pkg = Join-Path $Root "package.json"
if (-not (Test-Path -LiteralPath $Pkg)) {
  throw "package.json not found. Run this from sportcast project."
}

$Out = Join-Path $env:USERPROFILE "Desktop\sportcast.tar.gz"
if (Test-Path -LiteralPath $Out) {
  Remove-Item -LiteralPath $Out -Force
}

Write-Host "==> project: $Root"
Write-Host "==> output:  $Out"

Push-Location -LiteralPath $Root
try {
  & tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=.env --exclude=.env.local --exclude=prisma/dev.db --exclude=prisma/dev.db-journal --exclude=prisma/prod.db --exclude=prisma/prod.db-journal --exclude=public/uploads --exclude=logs -czf $Out .
  if ($LASTEXITCODE -ne 0) { throw "tar failed, exit=$LASTEXITCODE" }
}
finally {
  Pop-Location
}

$SizeMb = [math]::Round((Get-Item -LiteralPath $Out).Length / 1MB, 1)
Write-Host "==> done: $SizeMb MB"
Write-Host ""
Write-Host "Next:"
Write-Host "  scp `"$Out`" root@SERVER_IP:/opt/"
Write-Host "  bash /opt/sportcast/deploy/apply-upload.sh"
