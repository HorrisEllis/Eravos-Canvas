@echo off
title ERAVOS - build ERAVOS.exe (the canvas)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0packaging\windows\make-exe.ps1"
if errorlevel 1 (echo. & echo Something went wrong - see the message above. & pause & exit /b 1)
echo.
echo ERAVOS.exe is in dist\ERAVOS  -  the canvas only. Tools are packs: ERAVOS Library\Mods.
pause
