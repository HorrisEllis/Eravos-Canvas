@echo off
title ERAVOS - null render
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Null Render needs Node.js. Install the LTS version from https://nodejs.org then run this again.
  echo.
  start "" "https://nodejs.org"
  pause
  exit /b 1
)
echo.
echo  Null Render proves a change did not alter any sound.
echo    1 = record   (run this on the code BEFORE a change)
echo    2 = check    (run this AFTER the change)
echo.
choice /c 12 /n /m " Which? "
if errorlevel 2 (node tests\null-render.mjs) else (node tests\null-render.mjs --record)
echo.
pause
