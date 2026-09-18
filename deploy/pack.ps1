# One-click deploy to Aliyun ECS (default root@106.15.76.192)
# Usage:
#   Double-click:  发布到服务器.cmd
#   Or: powershell -ExecutionPolicy Bypass -File .\deploy\pack.ps1
#   Pack only (no upload):  .\deploy\pack.ps1 -PackOnly
#
# Output: Desktop\sportcast-src.tar.gz / sportcast-release.tar.gz

param(
  [string]$Server = "root@106.15.76.192",
  [string]$RemoteDir = "/opt/sportcast",
  [switch]$PackOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $Root "package.json"))) {
  throw "package.json not found"
}

$Desktop = [Environment]::GetFolderPath("Desktop")
$SrcTar = Join-Path $Desktop "sportcast-src.tar.gz"
$RelTar = Join-Path $Desktop "sportcast-release.tar.gz"

function New-SourceTar([string]$OutFile) {
  if (Test-Path -LiteralPath $OutFile) { Remove-Item -LiteralPath $OutFile -Force }
  Write-Host "==> packing source -> $OutFile"
  Push-Location -LiteralPath $Root
  try {
    & tar --exclude=node_modules --exclude=.next --exclude=release --exclude=.git --exclude=.env --exclude=.env.local --exclude=prisma/dev.db --exclude=prisma/dev.db-journal --exclude=prisma/prod.db --exclude=prisma/prod.db-journal --exclude=public/uploads --exclude=logs -czf $OutFile .
    if ($LASTEXITCODE -ne 0) { throw "tar failed" }
  } finally {
    Pop-Location
  }
  $mb = [math]::Round((Get-Item -LiteralPath $OutFile).Length / 1MB, 1)
  Write-Host "==> source pack $mb MB"
}

if ($Server -and -not $PackOnly) {
  New-SourceTar $SrcTar
  Write-Host "==> upload to ${Server}:/tmp/sportcast-src.tar.gz"
  & scp $SrcTar "${Server}:/tmp/sportcast-src.tar.gz"
  if ($LASTEXITCODE -ne 0) { throw "scp failed" }

  $RemoteScript = @'
set -euo pipefail
REMOTE_DIR="__REMOTE_DIR__"
mkdir -p /tmp/sportcast-build
rm -rf /tmp/sportcast-build/*
tar -xzf /tmp/sportcast-src.tar.gz -C /tmp/sportcast-build
cd /tmp/sportcast-build
sed -i "s/\r$//" deploy/*.sh || true
chmod +x deploy/*.sh || true

if ! command -v pnpm >/dev/null 2>&1; then
  npm install -g pnpm@12.4.1
fi
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm build
bash deploy/assemble-release.sh /tmp/sportcast-release-out
tar -czf /tmp/sportcast-release.tar.gz -C /tmp/sportcast-release-out .

mkdir -p "$REMOTE_DIR"
# keep secrets & data
if [ -f "$REMOTE_DIR/.env" ]; then cp -a "$REMOTE_DIR/.env" /tmp/sc.env.bak; fi
if [ -f "$REMOTE_DIR/prisma/prod.db" ]; then mkdir -p /tmp/sc.db && cp -a "$REMOTE_DIR/prisma/prod.db" /tmp/sc.db/; fi
if [ -d "$REMOTE_DIR/public/uploads" ]; then cp -a "$REMOTE_DIR/public/uploads" /tmp/sc.uploads.bak; fi

# replace app files with release
find "$REMOTE_DIR" -mindepth 1 -maxdepth 1 ! -name ".env" ! -name "prisma" ! -name "public" ! -name "logs" -exec rm -rf {} +
tar -xzf /tmp/sportcast-release.tar.gz -C "$REMOTE_DIR"

if [ -f /tmp/sc.env.bak ]; then cp -a /tmp/sc.env.bak "$REMOTE_DIR/.env"; fi
mkdir -p "$REMOTE_DIR/prisma" "$REMOTE_DIR/public" "$REMOTE_DIR/logs"
if [ -f /tmp/sc.db/prod.db ]; then cp -a /tmp/sc.db/prod.db "$REMOTE_DIR/prisma/prod.db"; fi
if [ -d /tmp/sc.uploads.bak ]; then rm -rf "$REMOTE_DIR/public/uploads"; mv /tmp/sc.uploads.bak "$REMOTE_DIR/public/uploads"; fi
mkdir -p "$REMOTE_DIR/public/uploads/videos"

if [ ! -f "$REMOTE_DIR/.env" ]; then
  echo "MISSING .env at $REMOTE_DIR/.env — create it then: bash $REMOTE_DIR/deploy/start-release.sh"
  exit 2
fi

cd "$REMOTE_DIR"
sed -i "s/\r$//" deploy/*.sh || true
bash deploy/start-release.sh
cp -a /tmp/sportcast-release.tar.gz /tmp/sportcast-release.done.tar.gz
echo "DEPLOY_OK"
'@
  $RemoteScript = $RemoteScript.Replace("__REMOTE_DIR__", $RemoteDir)

  $tmpSh = Join-Path $env:TEMP "sportcast-remote-deploy.sh"
  # LF line endings for bash
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($tmpSh, ($RemoteScript -replace "`r`n", "`n"), $utf8NoBom)

  Write-Host "==> remote build & start on $Server (this may take several minutes)..."
  & scp $tmpSh "${Server}:/tmp/sportcast-remote-deploy.sh"
  & ssh $Server "sed -i 's/\r$//' /tmp/sportcast-remote-deploy.sh && bash /tmp/sportcast-remote-deploy.sh"
  if ($LASTEXITCODE -ne 0) { throw "remote deploy failed" }

  Write-Host "==> download release tarball to Desktop (optional backup)"
  & scp "${Server}:/tmp/sportcast-release.tar.gz" $RelTar
  Write-Host "==> done. App should be running. Release copy: $RelTar"
  Write-Host "    Site: http://106.15.76.192/"
  Write-Host "    Admin: http://106.15.76.192/admin"
  return
}

# PackOnly: source pack for manual upload
New-SourceTar $SrcTar
Write-Host ""
Write-Host "Source pack ready: $SrcTar"
Write-Host "One-click deploy:"
Write-Host "  powershell -ExecutionPolicy Bypass -File .\deploy\pack.ps1"
Write-Host "Or double-click: 发布到服务器.cmd"
