@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   SportCast deploy -^> 106.15.76.192
echo ========================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\pack.ps1" -Server root@106.15.76.192
echo.
pause
