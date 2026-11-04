# ERAVOS uninstaller for a copy put in place by install.ps1 (Settings > Apps > ERAVOS > Uninstall runs this).
# Takes the app away: its folder, shortcuts and Settings > Apps entry. Your library, Documents\ERAVOS, is NOT touched.
# A copy from before the library moved may still hold projects, exports, drop, packs and .appdata beside the app - it asks before deleting those.
# (Installed with ERAVOS-Setup.exe: "Uninstall ERAVOS.exe" does the same.)
$ErrorActionPreference = 'Continue'
$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$system = $Dir -like "$env:ProgramFiles*" -or $Dir -like "${env:ProgramFiles(x86)}*"
if ($system -and -not $admin) { Start-Process powershell.exe -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs; exit }
$keep = @('projects', 'exports', 'drop', 'packs', '.appdata', 'ERAVOS Library', 'portable')
Get-Process ERAVOS -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$Dir*" } | ForEach-Object { $_.CloseMainWindow() | Out-Null; Start-Sleep 2; if (-not $_.HasExited) { $_.Kill() } }
$links = @('Programs', 'Desktop') | ForEach-Object { Join-Path ([Environment]::GetFolderPath($_)) 'ERAVOS.lnk' }
if ($system) { $links += @('CommonPrograms', 'CommonDesktopDirectory') | ForEach-Object { Join-Path ([Environment]::GetFolderPath($_)) 'ERAVOS.lnk' } }
$links | ForEach-Object { Remove-Item $_ -Force -ErrorAction SilentlyContinue }
Remove-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\ERAVOS' -Recurse -Force -ErrorAction SilentlyContinue
if ($system) { Remove-Item 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\ERAVOS', 'HKLM:\Software\ERAVOS' -Recurse -Force -ErrorAction SilentlyContinue }
Get-ChildItem -Force $Dir | Where-Object { $keep -notcontains $_.Name -and $_.Name -ne 'uninstall.ps1' } | Remove-Item -Recurse -Force
$mine = @(Get-ChildItem -Force $Dir | Where-Object { $keep -contains $_.Name })
if ($mine.Count) {
  Add-Type -AssemblyName PresentationFramework
  $a = [System.Windows.MessageBox]::Show("ERAVOS is removed. These older folders are still in`n$Dir`n($($mine.Name -join ', '))`n`nDelete them too? (Your library, Documents\ERAVOS, stays either way.)", 'ERAVOS', 'YesNo', 'Question')
  if ($a -eq 'Yes') { $mine | Remove-Item -Recurse -Force }
}
Remove-Item (Join-Path $Dir 'uninstall.ps1') -Force -ErrorAction SilentlyContinue
if (-not (Get-ChildItem -Force $Dir -ErrorAction SilentlyContinue)) { Remove-Item $Dir -Force -ErrorAction SilentlyContinue }
