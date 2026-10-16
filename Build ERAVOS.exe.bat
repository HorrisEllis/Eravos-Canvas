@echo off
title ERAVOS - build ERAVOS.exe
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0packaging\windows\make-exe.ps1"
if errorlevel 1 (echo. & echo Something went wrong - see the message above. & pause & exit /b 1)
echo.
echo ERAVOS.exe is in dist\ERAVOS  -  next to canvas\ and tools\, the same layout as this project.
echo Your projects, exports, drop, packs and .appdata folders there are kept when you build again.
pause
