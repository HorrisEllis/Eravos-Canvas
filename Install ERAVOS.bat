@echo off
title ERAVOS - install
rem ONE RUN: asks for admin, builds ERAVOS from this folder if needed, installs it to Program Files\ERAVOS for everyone on
rem this PC (Start menu, desktop, Settings > Apps), and starts it. Your work goes in Documents\ERAVOS.
net session >nul 2>&1
if errorlevel 1 (
  echo Asking Windows for permission to install ERAVOS for everyone on this PC...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0packaging\windows\install.ps1" %*
if errorlevel 1 (echo. & echo Something went wrong - see the message above. & pause & exit /b 1)
echo.
echo Done. ERAVOS is in the Start menu and on the desktop. Your projects, exports, packs and tools: Documents\ERAVOS
echo It checks GitHub for updates by itself.
pause
