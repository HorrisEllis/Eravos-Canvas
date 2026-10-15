# ERAVOS - build ERAVOS.exe from canvas/ (Windows PowerShell only, no Node needed)
# The exe IS the canvas: Electron + canvas/ + schemas/. No tools inside - tools/ is everything else and reaches
# the exe as packs (ERAVOS Library\Mods, or drop a .zip on the canvas).
# 1. downloads the official Electron win32-x64 runtime from GitHub (~110 MB, once, cached in %TEMP%)
# 2. assembles dist\ERAVOS\ERAVOS.exe + resources\app (main.js, preload.js, package.json, eravos\canvas, eravos\schemas)
# 3. writes dist\ERAVOS_<version>.zip and starts ERAVOS
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$repo = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$dist = Join-Path $repo 'dist'
$out = Join-Path $dist 'ERAVOS'
$pkg = Get-Content (Join-Path $repo 'desktop\package.json') -Raw | ConvertFrom-Json
$v = $pkg.electronVersion
$utf8 = New-Object System.Text.UTF8Encoding($false)   # no BOM
$cache = Join-Path $env:TEMP "electron-v$v-win32-x64.zip"
Write-Host "ERAVOS $($pkg.version): building $out"
if (-not (Test-Path $cache)) {
  Write-Host "Downloading Electron $v (about 110 MB, one time)..."
  Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/electron/electron/releases/download/v$v/electron-v$v-win32-x64.zip" -OutFile "$cache.part"
  Move-Item "$cache.part" $cache -Force
}
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force -Path $dist | Out-Null
Write-Host 'Unpacking runtime...'
Expand-Archive -Path $cache -DestinationPath $out -Force
Rename-Item -Path (Join-Path $out 'electron.exe') -NewName 'ERAVOS.exe'
$asar = Join-Path $out 'resources\default_app.asar'; if (Test-Path $asar) { Remove-Item $asar -Force }
Get-ChildItem (Join-Path $out 'locales') -Filter *.pak | Where-Object { $_.Name -notmatch '^en-(US|GB)\.pak$' } | Remove-Item -Force

Write-Host 'Adding the canvas...'
$app = Join-Path $out 'resources\app'
$web = Join-Path $app 'eravos'
New-Item -ItemType Directory -Force -Path (Join-Path $web 'tools') | Out-Null
Copy-Item (Join-Path $repo 'desktop\main.js') $app -Force
Copy-Item (Join-Path $repo 'desktop\preload.js') $app -Force
$appPkg = [ordered]@{ name = $pkg.name; productName = $pkg.productName; version = $pkg.version; description = $pkg.description; author = $pkg.author; main = 'main.js'; private = $true }
[IO.File]::WriteAllText((Join-Path $app 'package.json'), ($appPkg | ConvertTo-Json), $utf8)
Copy-Item (Join-Path $repo 'canvas') (Join-Path $web 'canvas') -Recurse -Force
Copy-Item (Join-Path $repo 'schemas') (Join-Path $web 'schemas') -Recurse -Force
Copy-Item (Join-Path $repo 'README.md') $web -Force
# the canvas loads tools/index.js last; in the exe it is empty - every tool arrives as a pack
[IO.File]::WriteAllText((Join-Path $web 'tools\index.js'), "/* ERAVOS.exe: no built-in tools - the canvas expands with packs (ERAVOS Library > Mods, or drop a .zip). */`nwindow.ERAVOS_DOMAINS = [];`n", $utf8)
[IO.File]::WriteAllText((Join-Path $out 'READ ME FIRST.txt'), (@(
  "ERAVOS $($pkg.version)", '',
  'Double-click ERAVOS.exe. That is the canvas - no install, no browser, nothing else needed.', '',
  'First launch: Windows may say "Windows protected your PC" because this build is not code-signed yet.',
  'Click "More info" then "Run anyway". It only asks once.', '',
  'The ERAVOS Library folder appears next to ERAVOS.exe on first run:',
  '  Mods      - the tools, one folder per domain (Mods\Music, ...). Put tool pack .zip files here, or drop them on the canvas.',
  '  Drop Here - put sounds, .mid files, packs or projects here; they appear on the canvas.',
  '  Projects / Exports - where Save and Bounce write.', '',
  'Move or back up everything: copy this whole ERAVOS folder.', '') -join "`r`n"), $utf8)

$zip = Join-Path $dist "ERAVOS_$($pkg.version).zip"
Write-Host "Writing $zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path $out -DestinationPath $zip -CompressionLevel Optimal
Write-Host 'Done. Starting ERAVOS...'
Start-Process (Join-Path $out 'ERAVOS.exe')
