@echo off
title ERAVOS - make ERAVOS.exe
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0make-exe.ps1"
if errorlevel 1 (echo. & echo Something went wrong - see the message above. & pause & exit /b 1)
echo.
echo ERAVOS.exe is in dist\ERAVOS, and the complete one-file zip is next to it in dist\.
pause
