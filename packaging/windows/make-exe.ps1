# ERAVOS - build ERAVOS.exe (Windows PowerShell only, no Node needed)
# The exe folder has the project's own layout: ERAVOS.exe beside canvas\ tools\ schemas\ README.md - the same folders
# as the repo - so the exe loads every domain from tools\ exactly like the dev build. No "ERAVOS Library", no packs needed.
# 1. downloads the official Electron win32-x64 runtime from GitHub (~110 MB, once, cached in %TEMP%)
# 2. assembles dist\ERAVOS: ERAVOS.exe + canvas\ tools\ schemas\ + resources\app (main.js, preload.js, package.json)
#    your folders (projects, exports, drop, packs, .appdata) are kept across rebuilds
# 3. writes dist\ERAVOS_<version>.zip (without your folders) and starts ERAVOS
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
$ship = @('canvas', 'tools', 'schemas', 'README.md')                                      # the project's app folders
$keep = @('projects', 'exports', 'drop', 'packs', '.appdata', 'ERAVOS Library')           # yours - never deleted here
Write-Host "ERAVOS $($pkg.version): building $out"
if (-not (Test-Path $cache)) {
  Write-Host "Downloading Electron $v (about 110 MB, one time)..."
  Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/electron/electron/releases/download/v$v/electron-v$v-win32-x64.zip" -OutFile "$cache.part"
  Move-Item "$cache.part" $cache -Force
}
New-Item -ItemType Directory -Force -Path $out | Out-Null
Get-ChildItem -Force $out | Where-Object { $keep -notcontains $_.Name } | Remove-Item -Recurse -Force
Write-Host 'Unpacking runtime...'
Expand-Archive -Path $cache -DestinationPath $out -Force
Rename-Item -Path (Join-Path $out 'electron.exe') -NewName 'ERAVOS.exe'
$asar = Join-Path $out 'resources\default_app.asar'; if (Test-Path $asar) { Remove-Item $asar -Force }
Get-ChildItem (Join-Path $out 'locales') -Filter *.pak | Where-Object { $_.Name -notmatch '^en-(US|GB)\.pak$' } | Remove-Item -Force

Write-Host 'Adding canvas\, tools\ and schemas\ ...'
$app = Join-Path $out 'resources\app'
New-Item -ItemType Directory -Force -Path $app | Out-Null
Copy-Item (Join-Path $repo 'desktop\main.js') $app -Force
Copy-Item (Join-Path $repo 'desktop\preload.js') $app -Force
$appPkg = [ordered]@{ name = $pkg.name; productName = $pkg.productName; version = $pkg.version; description = $pkg.description; author = $pkg.author; main = 'main.js'; private = $true }
[IO.File]::WriteAllText((Join-Path $app 'package.json'), ($appPkg | ConvertTo-Json), $utf8)
foreach ($s in $ship) { Copy-Item (Join-Path $repo $s) (Join-Path $out $s) -Recurse -Force }
$junk = @(Get-ChildItem -Recurse -Force -Directory (Join-Path $out 'tools') | Where-Object { $_.Name -eq 'node_modules' -or $_.Name.StartsWith('.') })
$junk | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
$domains = (Get-ChildItem -Directory (Join-Path $out 'tools') | Where-Object { Test-Path (Join-Path $_.FullName 'index.js') } | ForEach-Object { $_.Name }) -join ', '
Write-Host "  tools: $domains"
[IO.File]::WriteAllText((Join-Path $out 'READ ME FIRST.txt'), (@(
  "ERAVOS $($pkg.version)", '',
  'Double-click ERAVOS.exe - no install, no browser, nothing else needed.', '',
  'First launch: Windows may say "Windows protected your PC" because this build is not code-signed yet.',
  'Click "More info" then "Run anyway". It only asks once.', '',
  'This folder has the same layout as the ERAVOS project:',
  '  canvas\    the canvas (kernel, runtime)',
  '  tools\     every tool, one folder per domain (tools\music, tools\image, tools\video, ...)',
  '  schemas\   the formats tools and packs follow',
  'Your folders appear next to them on first run, and a rebuild never touches them:',
  '  projects\  Session > Save writes here      exports\  bounced WAVs and other exports',
  '  drop\      put sounds, .mid files, packs or projects here; they appear on the canvas',
  '  packs\     extra tool packs (.zip) - loaded every start; packs dropped on the canvas are kept here',
  '  .appdata\  ERAVOS''s own storage (autosave, presets)', '',
  'Coming from an older build? Your old "ERAVOS Library" projects, exports and autosave move across on first start.', '',
  'MIDI pads/keys: plug in, then MIDI Map > Connect MIDI. Close other music apps first - Windows lets only one app use a MIDI device at a time.',
  'Move or back up everything: copy this whole ERAVOS folder.', '') -join "`r`n"), $utf8)

$zip = Join-Path $dist "ERAVOS_$($pkg.version).zip"
Write-Host "Writing $zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
$stage = Join-Path $dist '.zip-stage\ERAVOS'
if (Test-Path (Split-Path $stage)) { Remove-Item (Split-Path $stage) -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null
Get-ChildItem -Force $out | Where-Object { $keep -notcontains $_.Name } | Copy-Item -Destination $stage -Recurse -Force
Compress-Archive -Path $stage -DestinationPath $zip -CompressionLevel Optimal
Remove-Item (Split-Path $stage) -Recurse -Force
Write-Host 'Done. Starting ERAVOS...'
Start-Process (Join-Path $out 'ERAVOS.exe')
