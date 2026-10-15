@echo off
title ERAVOS
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  ERAVOS needs Node.js to run its local server.
  echo  Install the LTS version from https://nodejs.org  then double-click Start ERAVOS again.
  echo.
  start "" "https://nodejs.org"
  pause
  exit /b 1
)
node serve.js --open
pause
