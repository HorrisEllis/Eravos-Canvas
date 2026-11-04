# ERAVOS installer (3.99) - Windows PowerShell only, nothing else needed.
# Asked: "an installer for eravos with an update service to check GitHub for updates".
#   1. finds ERAVOS: a zip you give it (-Zip), the one "Build ERAVOS.exe" made (dist\ERAVOS_<version>.zip), or the newest release on GitHub
#   2. installs it for you (no admin): %LOCALAPPDATA%\Programs\ERAVOS - your projects, exports, drop, packs and .appdata there are kept
#   3. adds ERAVOS to the Start menu and the desktop, and to Settings > Apps (with an uninstaller)
# The app then checks GitHub for updates itself and asks with a toast (desktop\updater.js).
param([string]$Zip = '', [string]$Dir = (Join-Path $env:LOCALAPPDATA 'Programs\ERAVOS'), [switch]$NoShortcuts, [switch]$NoStart)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$repoSlug = 'HorrisEllis/Eravos-Canvas'
$keep = @('projects', 'exports', 'drop', 'packs', '.appdata', 'ERAVOS Library')   # (tests\null-baseline sits inside tests\, which an update replaces: record again after updating)
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent (Split-Path -Parent $here)

if (-not $Zip) {
  $local = Get-ChildItem (Join-Path $repo 'dist') -Filter 'ERAVOS_*.zip' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($local) { $Zip = $local.FullName; Write-Host "Installing the build here: $($local.Name)" }
}
if (-not $Zip) {
  Write-Host 'Asking GitHub for the newest ERAVOS...'
  $rel = Invoke-RestMethod -UseBasicParsing -Headers @{ 'User-Agent' = 'ERAVOS-installer'; Accept = 'application/vnd.github+json' } -Uri "https://api.github.com/repos/$repoSlug/releases/latest"
  $asset = $rel.assets | Where-Object { $_.name -like 'ERAVOS_*.zip' } | Select-Object -First 1
  if (-not $asset) { throw "The newest release ($($rel.tag_name)) has no ERAVOS_*.zip yet. Run 'Build ERAVOS.exe.bat' first, then this again." }
  $Zip = Join-Path $env:TEMP $asset.name
  Write-Host "Downloading $($asset.name) ($([math]::Round($asset.size / 1MB)) MB)..."
  Invoke-WebRequest -UseBasicParsing -Uri $asset.browser_download_url -OutFile "$Zip.part"; Move-Item "$Zip.part" $Zip -Force
}

Get-Process ERAVOS -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$Dir*" } | ForEach-Object { Write-Host 'Closing ERAVOS...'; $_.CloseMainWindow() | Out-Null; Start-Sleep 2; if (-not $_.HasExited) { $_.Kill() } }
$stage = Join-Path $env:TEMP ('eravos-install-' + [guid]::NewGuid().ToString('N'))
Expand-Archive -Path $Zip -DestinationPath $stage -Force
$root = $stage; if (Test-Path (Join-Path $stage 'ERAVOS\ERAVOS.exe')) { $root = Join-Path $stage 'ERAVOS' }
if (-not (Test-Path (Join-Path $root 'ERAVOS.exe'))) { throw "$Zip has no ERAVOS.exe in it." }
New-Item -ItemType Directory -Force -Path $Dir | Out-Null
Get-ChildItem -Force $Dir | Where-Object { $keep -notcontains $_.Name } | Remove-Item -Recurse -Force
Get-ChildItem -Force $root | Where-Object { $keep -notcontains $_.Name } | Copy-Item -Destination $Dir -Recurse -Force
Copy-Item (Join-Path $here 'uninstall.ps1') $Dir -Force -ErrorAction SilentlyContinue
Remove-Item $stage -Recurse -Force
$exe = Join-Path $Dir 'ERAVOS.exe'
$version = (Get-Content (Join-Path $Dir 'resources\app\package.json') -Raw | ConvertFrom-Json).version

if (-not $NoShortcuts) {
  $sh = New-Object -ComObject WScript.Shell
  foreach ($lnk in @((Join-Path ([Environment]::GetFolderPath('Programs')) 'ERAVOS.lnk'), (Join-Path ([Environment]::GetFolderPath('Desktop')) 'ERAVOS.lnk'))) {
    $s = $sh.CreateShortcut($lnk); $s.TargetPath = $exe; $s.WorkingDirectory = $Dir; $s.Description = 'ERAVOS - a canvas of living instruments'; $s.Save()
  }
}
# Settings > Apps: name, version, where, and how to remove it (per user - no admin)
$key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\ERAVOS'
New-Item -Path $key -Force | Out-Null
$un = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $Dir 'uninstall.ps1')`""
@{ DisplayName = 'ERAVOS'; DisplayVersion = $version; Publisher = 'ERAVOS'; InstallLocation = $Dir; DisplayIcon = $exe; UninstallString = $un; NoModify = 1; NoRepair = 1 }.GetEnumerator() |
  ForEach-Object { New-ItemProperty -Path $key -Name $_.Key -Value $_.Value -Force | Out-Null }

Write-Host "ERAVOS $version is installed in $Dir"
Write-Host 'It checks GitHub for updates by itself and asks before updating.'
if (-not $NoStart) { Start-Process $exe }
