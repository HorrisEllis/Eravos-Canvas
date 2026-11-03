@echo off
title ERAVOS - install
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0packaging\windows\install.ps1" %*
if errorlevel 1 (echo. & echo Something went wrong - see the message above. & pause & exit /b 1)
echo.
echo ERAVOS is installed: Start menu and desktop. It checks GitHub for updates by itself.
pause
