# ERAVOS - build ERAVOS.exe (Windows PowerShell only, no Node needed)
# The exe folder has the project's own layout: ERAVOS.exe beside canvas\ tools\ schemas\ README.md - the same folders
# as the repo - so the exe loads every domain from tools\ exactly like the dev build. No "ERAVOS Library", no packs needed.
# 1. downloads the official Electron win32-x64 runtime from GitHub (~110 MB, once, cached in %TEMP%)
# 2. assembles dist\ERAVOS: ERAVOS.exe + canvas\ tools\ schemas\ + resources\app (main.js, preload.js, package.json)
#    your folders (projects, exports, drop, packs, .appdata) are kept across rebuilds
# 3. writes dist\ERAVOS_<version>.zip (without your folders)
# 4. writes dist\ERAVOS-Setup-<version>.exe - the installer (Program Files, Start menu, Settings > Apps) - when NSIS is on this PC
#    (winget install NSIS.NSIS, or choco install nsis); without it you get the zip and the portable folder only
# 5. starts ERAVOS
param([switch]$NoStart, [switch]$NoSetup)   # -NoStart: build only (the release workflow) - -NoSetup: no ERAVOS-Setup.exe (install.ps1 installs the folder itself)
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
$ship = @('canvas', 'tools', 'schemas', 'host', 'tests', 'README.md')                                      # the project's app folders
$keep = @('projects', 'exports', 'drop', 'packs', '.appdata', 'ERAVOS Library', 'portable')   # older builds kept your work here - never deleted (the app moves it to Documents\ERAVOS)
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
Copy-Item (Join-Path $repo 'desktop\updater.js') $app -Force   # 3.99 the update service
Copy-Item (Join-Path $repo 'desktop\apply-update.ps1') $app -Force   # 3.111 ERAVOS Update: puts a downloaded update in place
$appPkg = [ordered]@{ name = $pkg.name; productName = $pkg.productName; version = $pkg.version; description = $pkg.description; author = $pkg.author; main = 'main.js'; private = $true }
[IO.File]::WriteAllText((Join-Path $app 'package.json'), ($appPkg | ConvertTo-Json), $utf8)
foreach ($s in $ship) { Copy-Item (Join-Path $repo $s) (Join-Path $out $s) -Recurse -Force }
Copy-Item (Join-Path $repo 'packaging\windows\uninstall.ps1') $out -Force   # 3.99 the installer's uninstaller travels with the app
Remove-Item (Join-Path $out 'tests\null-baseline'), (Join-Path $out 'tests\out') -Recurse -Force -ErrorAction SilentlyContinue   # recorded on a machine, never shipped
$junk = @(Get-ChildItem -Recurse -Force -Directory (Join-Path $out 'tools') | Where-Object { $_.Name -eq 'node_modules' -or $_.Name.StartsWith('.') })
$junk | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
$domains = (Get-ChildItem -Directory (Join-Path $out 'tools') | Where-Object { Test-Path (Join-Path $_.FullName 'index.js') } | ForEach-Object { $_.Name }) -join ', '
Write-Host "  tools: $domains"
[IO.File]::WriteAllText((Join-Path $out 'READ ME FIRST.txt'), (@(
  "ERAVOS $($pkg.version)", '',
  'Double-click ERAVOS.exe - no install, no browser, nothing else needed.', '',
  'First launch: Windows may say "Windows protected your PC" because this build is not code-signed yet.',
  'Click "More info" then "Run anyway". It only asks once.', '',
  'Install it for everyone on this PC: run ERAVOS-Setup-<version>.exe (Program Files, Start menu, Settings > Apps).',
  'Or just double-click ERAVOS.exe here - it runs from any folder.', '',
  'This folder is the app, with the same layout as the ERAVOS project:',
  '  canvas\    the canvas (kernel, runtime)',
  '  tools\     every tool, one folder per domain (tools\music, tools\image, tools\video, ...)',
  '  schemas\   the formats tools and packs follow', '',
  'YOUR LIBRARY is Documents\ERAVOS - everything you make goes there, and installing, updating or uninstalling never touches it:',
  '  projects\  Session > Save writes here      exports\  bounced WAVs, renders and other exports',
  '  packs\     preset packs and .zip packs - loaded every start; packs dropped on the canvas are kept here',
  '  tools\     extra tool packs (.zip) - loaded every start',
  '  drop\      put sounds, .mid files, packs or projects here; they appear on the canvas',
  '  .appdata\  ERAVOS''s own storage (autosave, presets)',
  'Want it all in this folder instead (a USB stick)? Put an empty file named  portable  next to ERAVOS.exe.', '',
  'Coming from an older build? Your projects, exports, packs and autosave move into Documents\ERAVOS on first start.', '',
  'MIDI pads/keys: plug in, then MIDI Map > Connect MIDI. Close other music apps first - Windows lets only one app use a MIDI device at a time.',
  'Back up everything you made: copy Documents\ERAVOS.', '') -join "`r`n"), $utf8)

# 3.141 ERAVOS Update.exe - the updater as its own small program (his: "why not make it another exe?"), beside ERAVOS.exe, so the zip
# and the Setup both carry it. Without NSIS the app falls back to apply-update.ps1.
$nsisU = @((Get-Command makensis.exe -ErrorAction SilentlyContinue | ForEach-Object { $_.Source }), (Join-Path ${env:ProgramFiles(x86)} 'NSIS\makensis.exe'), (Join-Path $env:ProgramFiles 'NSIS\makensis.exe')) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if ($nsisU) {
  Write-Host 'Writing ERAVOS Update.exe'
  & $nsisU /V2 "/DOUT=$(Join-Path $out 'ERAVOS Update.exe')" (Join-Path $repo 'packaging\windows\eravos-update.nsi')
  if ($LASTEXITCODE -ne 0) { throw "makensis (ERAVOS Update.exe) failed ($LASTEXITCODE)" }
}
$zip = Join-Path $dist "ERAVOS_$($pkg.version).zip"
Write-Host "Writing $zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
$stage = Join-Path $dist '.zip-stage\ERAVOS'
if (Test-Path (Split-Path $stage)) { Remove-Item (Split-Path $stage) -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null
Get-ChildItem -Force $out | Where-Object { $keep -notcontains $_.Name } | Copy-Item -Destination $stage -Recurse -Force
Compress-Archive -Path $stage -DestinationPath $zip -CompressionLevel Optimal
Remove-Item (Split-Path $stage) -Recurse -Force

# the installer (NSIS): Program Files\ERAVOS for everyone on this PC, shortcuts, Settings > Apps, an uninstaller
$nsis = @((Get-Command makensis.exe -ErrorAction SilentlyContinue | ForEach-Object { $_.Source }), (Join-Path ${env:ProgramFiles(x86)} 'NSIS\makensis.exe'), (Join-Path $env:ProgramFiles 'NSIS\makensis.exe')) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
$setup = Join-Path $dist "ERAVOS-Setup-$($pkg.version).exe"
if ($NoSetup) { }
elseif ($nsis) {
  Write-Host "Writing $setup"
  $nsiStage = Join-Path $dist '.setup-stage\ERAVOS'
  if (Test-Path (Split-Path $nsiStage)) { Remove-Item (Split-Path $nsiStage) -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $nsiStage | Out-Null
  Get-ChildItem -Force $out | Where-Object { $keep -notcontains $_.Name -and $_.Name -ne 'uninstall.ps1' } | Copy-Item -Destination $nsiStage -Recurse -Force
  & $nsis /V2 "/DVERSION=$($pkg.version)" "/DSRC=$nsiStage" "/DOUT=$setup" (Join-Path $repo 'packaging\windows\eravos.nsi')
  if ($LASTEXITCODE -ne 0) { throw "makensis failed ($LASTEXITCODE)" }
  Remove-Item (Split-Path $nsiStage) -Recurse -Force
} else {
  Write-Host 'NSIS is not installed, so no ERAVOS-Setup.exe this time (winget install NSIS.NSIS, then build again). The zip and dist\ERAVOS work without it.'
}
if ($NoStart) { Write-Host 'Done.'; exit 0 }
Write-Host 'Done. Starting ERAVOS...'
Start-Process (Join-Path $out 'ERAVOS.exe')
