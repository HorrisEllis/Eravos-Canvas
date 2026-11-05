# ERAVOS installer - ONE RUN. "Install ERAVOS.bat" runs this as admin; nothing else is needed (no Node, no NSIS, no release).
# Installs ERAVOS to the system: Program Files\ERAVOS, every user on this PC, Start menu + desktop, Settings > Apps (with an uninstaller).
# Where ERAVOS comes from, first found wins:
#   -Setup <exe> / dist\ERAVOS-Setup-*.exe  -> runs that Setup (made by "Build ERAVOS.exe" when NSIS is on the PC)
#   this project folder (canvas\ is here)   -> builds ERAVOS right now (packaging\windows\make-exe.ps1, downloads Electron once), installs it
#   -Zip <zip> / GitHub's newest release    -> its ERAVOS-Setup exe, or its ERAVOS_<version>.zip
# Your library, Documents\ERAVOS (projects, exports, packs, tools, drop), is never touched. An old per-user copy in
# %LOCALAPPDATA%\Programs\ERAVOS is tidied away; ERAVOS moves its work into the library the first time it starts.
param([string]$Setup = '', [string]$Zip = '', [switch]$NoBuild, [switch]$NoStart, [string]$Dir = (Join-Path $env:ProgramFiles 'ERAVOS'))
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$repoSlug = 'HorrisEllis/Eravos-Canvas'
$keep = @('projects', 'exports', 'drop', 'packs', '.appdata', 'ERAVOS Library', 'portable')   # older builds kept your work beside the exe
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent (Split-Path -Parent $here)
$key = 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\ERAVOS'

$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {   # run straight from PowerShell: ask once, carry on in an admin window
  $a = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$($MyInvocation.MyCommand.Path)`"")
  foreach ($k in $PSBoundParameters.Keys) { $v = $PSBoundParameters[$k]; if ($v -is [switch]) { if ($v) { $a += "-$k" } } else { $a += "-$k"; $a += "`"$v`"" } }
  $p = Start-Process powershell.exe -ArgumentList $a -Verb RunAs -Wait -PassThru; exit $p.ExitCode
}

$rel = $null
function Latest { if (-not $script:rel) { Write-Host 'Asking GitHub for the newest ERAVOS...'; $script:rel = Invoke-RestMethod -UseBasicParsing -Headers @{ 'User-Agent' = 'ERAVOS-installer'; Accept = 'application/vnd.github+json' } -Uri "https://api.github.com/repos/$repoSlug/releases/latest" }; $script:rel }
function Fetch($asset) { $f = Join-Path $env:TEMP $asset.name; Write-Host "Downloading $($asset.name) ($([math]::Round($asset.size / 1MB)) MB)..."; Invoke-WebRequest -UseBasicParsing -Uri $asset.browser_download_url -OutFile "$f.part"; Move-Item "$f.part" $f -Force; $f }
function Launch($exe) { if (-not $NoStart -and (Test-Path $exe)) { Start-Process explorer.exe -ArgumentList "`"$exe`"" } }   # via Explorer: ERAVOS runs as you, not as admin
function Close-Eravos { Get-Process ERAVOS -ErrorAction SilentlyContinue | ForEach-Object { Write-Host 'Closing ERAVOS (autosave keeps your song)...'; $_.CloseMainWindow() | Out-Null; Start-Sleep 2; if (-not $_.HasExited) { $_.Kill() } } }
function Tidy-OldCopy {   # the old per-user install: app files, shortcuts, Settings > Apps entry (your folders in it stay until ERAVOS moves them)
  $old = Join-Path $env:LOCALAPPDATA 'Programs\ERAVOS'
  if (Test-Path (Join-Path $old 'ERAVOS.exe')) {
    Write-Host "Removing the old per-user copy in $old"
    Get-ChildItem -Force $old | Where-Object { $keep -notcontains $_.Name } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  }
  foreach ($lnk in @((Join-Path ([Environment]::GetFolderPath('Programs')) 'ERAVOS.lnk'), (Join-Path ([Environment]::GetFolderPath('Desktop')) 'ERAVOS.lnk'))) { Remove-Item $lnk -Force -ErrorAction SilentlyContinue }
  Remove-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\ERAVOS' -Recurse -Force -ErrorAction SilentlyContinue
}
function Done($where) {
  Tidy-OldCopy
  Write-Host ''
  Write-Host "ERAVOS is installed in $where"
  Write-Host "Your library (projects, exports, packs, tools, drop): $([Environment]::GetFolderPath('MyDocuments'))\ERAVOS"
  Launch (Join-Path $where 'ERAVOS.exe'); exit 0
}
function Run-Setup($exe) {
  Close-Eravos
  Write-Host "Running $(Split-Path -Leaf $exe)..."
  $p = Start-Process -FilePath $exe -ArgumentList '/S', "/D=$Dir" -Wait -PassThru
  if ($p.ExitCode -ne 0) { throw "ERAVOS Setup stopped (exit $($p.ExitCode))." }
  Done $Dir
}
# the same as the Setup does, straight from a built ERAVOS folder (no NSIS needed)
function Install-Folder($src) {
  if (-not (Test-Path (Join-Path $src 'ERAVOS.exe'))) { throw "$src has no ERAVOS.exe in it." }
  Close-Eravos
  Write-Host "Installing into $Dir ..."
  New-Item -ItemType Directory -Force -Path $Dir | Out-Null
  Get-ChildItem -Force $Dir | Where-Object { $keep -notcontains $_.Name } | Remove-Item -Recurse -Force
  Get-ChildItem -Force $src | Where-Object { $keep -notcontains $_.Name } | Copy-Item -Destination $Dir -Recurse -Force
  Copy-Item (Join-Path $here 'uninstall.ps1') $Dir -Force
  $exe = Join-Path $Dir 'ERAVOS.exe'
  $version = (Get-Content (Join-Path $Dir 'resources\app\package.json') -Raw | ConvertFrom-Json).version
  $sh = New-Object -ComObject WScript.Shell   # for everyone on this PC
  foreach ($lnk in @((Join-Path ([Environment]::GetFolderPath('CommonPrograms')) 'ERAVOS.lnk'), (Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) 'ERAVOS.lnk'))) {
    $s = $sh.CreateShortcut($lnk); $s.TargetPath = $exe; $s.WorkingDirectory = $Dir; $s.Description = 'ERAVOS - a canvas of living instruments'; $s.Save()
  }
  New-Item -Path $key -Force | Out-Null
  New-Item -Path 'HKLM:\Software\ERAVOS' -Force | Out-Null; Set-ItemProperty 'HKLM:\Software\ERAVOS' -Name InstallDir -Value $Dir
  $un = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $Dir 'uninstall.ps1')`""
  $size = [int]((Get-ChildItem $Dir -Recurse -File | Measure-Object Length -Sum).Sum / 1KB)
  @{ DisplayName = 'ERAVOS'; DisplayVersion = $version; Publisher = 'ERAVOS'; InstallLocation = $Dir; DisplayIcon = $exe; UninstallString = $un; NoModify = 1; NoRepair = 1; EstimatedSize = $size }.GetEnumerator() |
    ForEach-Object { New-ItemProperty -Path $key -Name $_.Key -Value $_.Value -Force | Out-Null }
  Write-Host "ERAVOS $version"
  Done $Dir
}

# 1. a Setup you gave it, or the one "Build ERAVOS.exe" made
if (-not $Setup -and -not $Zip) { $s = Get-ChildItem (Join-Path $repo 'dist') -Filter 'ERAVOS-Setup-*.exe' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if ($s -and $NoBuild) { $Setup = $s.FullName } }
if ($Setup) { Run-Setup $Setup }
# 2. this project folder: build it now, install it
if (-not $Zip -and -not $NoBuild -and (Test-Path (Join-Path $repo 'canvas\index.html'))) {
  Write-Host 'Building ERAVOS from this folder (the first time downloads Electron, about 110 MB)...'
  & (Join-Path $here 'make-exe.ps1') -NoStart -NoSetup
  Install-Folder (Join-Path $repo 'dist\ERAVOS')
}
# 3. a zip you gave it, or GitHub's newest release
if (-not $Zip) {
  $r = Latest
  $a = $r.assets | Where-Object { $_.name -like 'ERAVOS-Setup-*.exe' } | Select-Object -First 1
  if ($a) { Run-Setup (Fetch $a) }
  $a = $r.assets | Where-Object { $_.name -like 'ERAVOS_*.zip' } | Select-Object -First 1
  if (-not $a) { throw "The newest release ($($r.tag_name)) has no ERAVOS to download yet. Run this from the ERAVOS project folder instead - it builds ERAVOS itself." }
  $Zip = Fetch $a
}
$stage = Join-Path $env:TEMP ('eravos-install-' + [guid]::NewGuid().ToString('N'))
Expand-Archive -Path $Zip -DestinationPath $stage -Force
$root = $stage; if (Test-Path (Join-Path $stage 'ERAVOS\ERAVOS.exe')) { $root = Join-Path $stage 'ERAVOS' }
try { Install-Folder $root } finally { Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue }
