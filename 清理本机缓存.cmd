@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Cleaning local caches / node_modules / .next ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\clean.ps1" -Deep
echo.
pause
