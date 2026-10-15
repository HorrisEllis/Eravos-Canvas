# ERAVOS — build the complete Windows app without Node (Windows PowerShell only)
# Input:  dist\windows-x64\ERAVOS  — the overlay: resources\app (the canvas) + ERAVOS Library\Mods (the tools as packs).
#         Made from source by:  node desktop/build.mjs --no-electron --out dist/windows-x64   (release zips ship it prebuilt)
# 1. downloads the official Electron win32-x64 runtime from GitHub (~110 MB, once, cached in %TEMP%)
# 2. assembles dist\ERAVOS\ERAVOS.exe + the overlay
# 3. writes dist\ERAVOS_<version>_complete.zip and starts ERAVOS
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$repo = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$dist = Join-Path $repo 'dist'
$src = Join-Path $dist 'windows-x64\ERAVOS'
$out = Join-Path $dist 'ERAVOS'
if (-not (Test-Path (Join-Path $src 'resources\app\package.json'))) {
  throw "Missing $src. Build it with:  node desktop/build.mjs --no-electron --out dist/windows-x64"
}
$app = Get-Content (Join-Path $src 'resources\app\package.json') -Raw | ConvertFrom-Json
$pkg = Get-Content (Join-Path $repo 'desktop\package.json') -Raw | ConvertFrom-Json
$v = $pkg.electronVersion
$cache = Join-Path $env:TEMP "electron-v$v-win32-x64.zip"
Write-Host "ERAVOS $($app.version): building in $out"
if (-not (Test-Path $cache)) {
  Write-Host "Downloading Electron $v (about 110 MB, one time)..."
  Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/electron/electron/releases/download/v$v/electron-v$v-win32-x64.zip" -OutFile "$cache.part"
  Move-Item "$cache.part" $cache -Force
}
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
Write-Host 'Unpacking runtime...'
Expand-Archive -Path $cache -DestinationPath $out -Force
Rename-Item -Path (Join-Path $out 'electron.exe') -NewName 'ERAVOS.exe'
$asar = Join-Path $out 'resources\default_app.asar'; if (Test-Path $asar) { Remove-Item $asar -Force }
Get-ChildItem (Join-Path $out 'locales') -Filter *.pak | Where-Object { $_.Name -notmatch '^en-(US|GB)\.pak$' } | Remove-Item -Force
Write-Host 'Adding the canvas and the tool packs...'
Copy-Item (Join-Path $src 'resources\app') (Join-Path $out 'resources\app') -Recurse -Force
New-Item -ItemType Directory -Force -Path (Join-Path $out 'ERAVOS Library') | Out-Null
Copy-Item (Join-Path $src 'ERAVOS Library\Mods') (Join-Path $out 'ERAVOS Library\Mods') -Recurse -Force
Copy-Item (Join-Path $src 'READ ME FIRST.txt') $out -Force
$zip = Join-Path $dist "ERAVOS_$($app.version)_complete.zip"
Write-Host "Writing the complete package: $zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path $out -DestinationPath $zip -CompressionLevel Optimal
Write-Host 'Done. Starting ERAVOS...'
Start-Process (Join-Path $out 'ERAVOS.exe')
