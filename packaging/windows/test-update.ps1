# Tests ERAVOS Update (desktop\apply-update.ps1) on Windows (3.111) - run by the release workflow after the build.
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
# 3.118 when it fails, say why: does the helper parse, what did it print, what did it log
$helper = Join-Path $repo 'desktop\apply-update.ps1'; $tok = $null; $perr = $null
[void][System.Management.Automation.Language.Parser]::ParseFile($helper, [ref]$tok, [ref]$perr)
if ($perr -and $perr.Count) { $perr | ForEach-Object { Write-Host "PARSE: line $($_.Extent.StartLineNumber): $($_.Message)" }; throw 'apply-update.ps1 does not parse' }
$ErrorActionPreference = 'Continue'
& powershell -NoProfile -ExecutionPolicy Bypass -File $helper -Staged $built -Dest $inst -Version '9.9.9' -Work $work *>&1 | ForEach-Object { Write-Host "HELPER: $_" }
Write-Host "helper exit code: $LASTEXITCODE"
Write-Host "work folder: $work exists=$(Test-Path $work)"; if (Test-Path $work) { Get-ChildItem -Force $work | ForEach-Object { Write-Host "  $($_.Name)" } }
Write-Host "installed folder has: $((Get-ChildItem -Force $inst | ForEach-Object { $_.Name }) -join ', ')"
$ErrorActionPreference = 'Stop'
Start-Sleep 3
$logf = Join-Path $work 'update.log'; if (Test-Path $logf) { Get-Content $logf | ForEach-Object { Write-Host "LOG: $_" } } else { Write-Host 'no update.log was written' }
$resf = Join-Path $work 'update-result.json'; if (-not (Test-Path $resf)) { throw 'no update-result.json was written (see the HELPER / LOG lines above)' }
$res = Get-Content $resf -Raw | ConvertFrom-Json
Get-Process ERAVOS -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$inst*" } | Stop-Process -Force
if (-not $res.ok) { throw "update failed: $($res.message)" }
if ((Get-Content (Join-Path $inst 'canvas\index.html') -Raw) -match '^OLD') { throw 'the new files were not put in place' }
if ((Get-Content (Join-Path $inst 'projects\mine.json') -Raw).Trim() -ne 'MINE') { throw 'your projects were touched' }
Write-Host 'ERAVOS Update: ok'
Remove-Item $root -Recurse -Force -ErrorAction SilentlyContinue
