# One-click publish to production ECS
# Default: root@106.15.76.192
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy\publish.ps1

param(
  [string]$Server = "root@106.15.76.192"
)

$here = $PSScriptRoot
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $here "pack.ps1") -Server $Server
exit $LASTEXITCODE
