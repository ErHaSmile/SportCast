# Local cleanup: caches, build output, leftover packs
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy\clean.ps1
# Optional: -Deep  also prune pnpm store unused packages

param(
  [switch]$Deep
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "==> clean project: $Root"

function Remove-Path([string]$Path) {
  if (Test-Path -LiteralPath $Path) {
    Write-Host "  remove $Path"
    Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Push-Location -LiteralPath $Root
try {
  Remove-Path (Join-Path $Root "node_modules")
  Remove-Path (Join-Path $Root ".next")
  Remove-Path (Join-Path $Root "release")
  Remove-Path (Join-Path $Root "out")
  Remove-Path (Join-Path $Root "coverage")
  Remove-Path (Join-Path $Root "logs")
  Get-ChildItem -LiteralPath $Root -Filter "*.tsbuildinfo" -ErrorAction SilentlyContinue | Remove-Item -Force
}
finally {
  Pop-Location
}

$DesktopPacks = @(
  (Join-Path $env:USERPROFILE "Desktop\sportcast.tar.gz"),
  (Join-Path $env:USERPROFILE "Desktop\sportcast-release.tar.gz")
)
foreach ($p in $DesktopPacks) { Remove-Path $p }

$Sandbox = Join-Path $env:LOCALAPPDATA "Temp\cursor-sandbox-cache"
Remove-Path $Sandbox

if ($Deep) {
  Write-Host "==> deep: pnpm store prune"
  $pnpm = "D:\install\npm-global\pnpm.cmd"
  if (Test-Path $pnpm) {
    & $pnpm store prune
  } elseif (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm store prune
  }
  $npmCache = "D:\install\npm-cache"
  if (Test-Path $npmCache) {
    Write-Host "  npm cache verify/clean at $npmCache"
    npm cache clean --force 2>$null
  }
}

Write-Host "==> clean done"
Write-Host "  Reinstall: pnpm install"
