# ERAVOS uninstaller (3.99): takes the app away; asks before touching your projects, exports, drop, packs and .appdata.
$ErrorActionPreference = 'Continue'
$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$keep = @('projects', 'exports', 'drop', 'packs', '.appdata', 'ERAVOS Library')
Get-Process ERAVOS -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$Dir*" } | ForEach-Object { $_.CloseMainWindow() | Out-Null; Start-Sleep 2; if (-not $_.HasExited) { $_.Kill() } }
foreach ($lnk in @((Join-Path ([Environment]::GetFolderPath('Programs')) 'ERAVOS.lnk'), (Join-Path ([Environment]::GetFolderPath('Desktop')) 'ERAVOS.lnk'))) { Remove-Item $lnk -Force -ErrorAction SilentlyContinue }
Remove-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\ERAVOS' -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Force $Dir | Where-Object { $keep -notcontains $_.Name -and $_.Name -ne 'uninstall.ps1' } | Remove-Item -Recurse -Force
$mine = @(Get-ChildItem -Force $Dir | Where-Object { $keep -contains $_.Name })
if ($mine.Count) {
  Add-Type -AssemblyName PresentationFramework
  $a = [System.Windows.MessageBox]::Show("ERAVOS is removed. Also delete your work in`n$Dir`n($($mine.Name -join ', '))?", 'ERAVOS', 'YesNo', 'Question')
  if ($a -eq 'Yes') { $mine | Remove-Item -Recurse -Force }
}
Remove-Item (Join-Path $Dir 'uninstall.ps1') -Force -ErrorAction SilentlyContinue
if (-not (Get-ChildItem -Force $Dir -ErrorAction SilentlyContinue)) { Remove-Item $Dir -Force -ErrorAction SilentlyContinue }
