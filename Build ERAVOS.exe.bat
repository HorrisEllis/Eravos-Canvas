@echo off
title ERAVOS - build ERAVOS.exe
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0packaging\windows\make-exe.ps1"
if errorlevel 1 (echo. & echo Something went wrong - see the message above. & pause & exit /b 1)
echo.
echo ERAVOS.exe is in dist\ERAVOS  -  next to canvas\ and tools\, the same layout as this project.
echo The installer, ERAVOS-Setup-^<version^>.exe, is in dist\ too (needs NSIS: winget install NSIS.NSIS).
echo Your projects, exports, packs and tools are kept in Documents\ERAVOS.
pause
