# Tests ERAVOS Update (desktop\apply-update.ps1) on Windows (3.101) - run by the release workflow after the build.
# An "installed" copy of the built app (with your folders in it and an old marker file) is updated from the freshly built one:
# the new files must be in place, your folders untouched, the result file must say ok, and it must start ERAVOS.
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$built = Join-Path $repo 'dist\ERAVOS'
$root = Join-Path $env:TEMP ('eravos-update-test-' + [guid]::NewGuid().ToString('N'))
$inst = Join-Path $root 'installed'; $work = Join-Path $inst '.appdata\update'
New-Item -ItemType Directory -Force -Path $inst | Out-Null
robocopy $built $inst /E /NFL /NDL /NJH /NJS /NP | Out-Null
# what an older install has: a file the new one changes, and your own work
Set-Content (Join-Path $inst 'canvas\index.html') 'OLD'
New-Item -ItemType Directory -Force -Path (Join-Path $inst 'projects') | Out-Null; Set-Content (Join-Path $inst 'projects\mine.json') 'MINE'
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo 'desktop\apply-update.ps1') -Staged $built -Dest $inst -Version '9.9.9' -Work $work
Start-Sleep 3
$res = Get-Content (Join-Path $work 'update-result.json') -Raw | ConvertFrom-Json
Get-Content (Join-Path $work 'update.log') | Write-Host
Get-Process ERAVOS -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$inst*" } | Stop-Process -Force
if (-not $res.ok) { throw "update failed: $($res.message)" }
if ((Get-Content (Join-Path $inst 'canvas\index.html') -Raw) -match '^OLD') { throw 'the new files were not put in place' }
if ((Get-Content (Join-Path $inst 'projects\mine.json') -Raw).Trim() -ne 'MINE') { throw 'your projects were touched' }
Write-Host 'ERAVOS Update: ok'
Remove-Item $root -Recurse -Force -ErrorAction SilentlyContinue
