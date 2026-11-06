# ERAVOS Update - puts a downloaded update in place (3.111). Started by ERAVOS (desktop/updater.js) as its own process, hidden, when you
# choose Restart now or close ERAVOS with an update ready. It:
#   1. waits until every ERAVOS process from this folder has closed (the app's helpers outlive its window by a moment; after 60 s it ends them)
#   2. backs up the app's own files (never your projects, exports, drop, packs or .appdata)
#   3. copies the new files in (robocopy, retrying files that are still locked)
#   4. on any failure puts the backup back, so ERAVOS still starts as it was
#   5. writes what happened to update.log and update-result.json (ERAVOS reads it at its next start and tells you), and starts ERAVOS
# -Setup <ERAVOS-Setup-x.exe>: installed by Setup (Program Files) - it runs the new Setup silently into the same folder instead of 2-4
param([string]$Staged = '', [string]$Setup = '', [Parameter(Mandatory)][string]$Dest, [Parameter(Mandatory)][string]$Version, [Parameter(Mandatory)][string]$Work)
$ErrorActionPreference = 'Stop'
Write-Host "ERAVOS Update starting: Dest=$Dest Work=$Work Staged=$Staged Setup=$Setup Version=$Version"
$log = Join-Path $Work 'update.log'; $result = Join-Path $Work 'update-result.json'
$keep = @('projects', 'exports', 'drop', 'packs', '.appdata', 'ERAVOS Library', 'portable')
function Say($m) { $line = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $m; Write-Host $line; Add-Content -LiteralPath $log -Value $line -Encoding UTF8 }
function Done($ok, $msg) {
  $o = [ordered]@{ ok = $ok; version = $Version; message = $msg; log = $log; at = (Get-Date).ToString('o') }
  [IO.File]::WriteAllText($result, ($o | ConvertTo-Json), (New-Object System.Text.UTF8Encoding($false)))
}
function Mine { @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith($Dest, [StringComparison]::OrdinalIgnoreCase) }) }
function Copy-Tree($from, $to) {
  # /E every folder; /R /W retry a locked file; /XD /XF leave your folders and the update's own work alone; exit codes 0-7 are success
  $xd = @($keep | ForEach-Object { Join-Path $from $_ }) + @($keep | ForEach-Object { Join-Path $to $_ })
  $rargs = @($from, $to, '/E', '/R:20', '/W:1', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/XD') + $xd
  # a native tool's stderr would stop the script under 'Stop' (Windows PowerShell 5.1); robocopy's exit code is the verdict
  $ErrorActionPreference = 'Continue'; $out = & robocopy @rargs 2>&1; $code = $LASTEXITCODE; $ErrorActionPreference = 'Stop'
  if ($code -ge 8) { throw "robocopy $from -> $to failed ($code): $($out -join ' ')" }
}
$exe = Join-Path $Dest 'ERAVOS.exe'
try {
  New-Item -ItemType Directory -Force -Path $Work | Out-Null
  Say "ERAVOS Update to $Version - from $Staged into $Dest"
  if (-not $Setup -and -not (Test-Path (Join-Path $Staged 'ERAVOS.exe'))) { throw "the update has no ERAVOS.exe ($Staged)" }
  if ($Setup -and -not (Test-Path $Setup)) { throw "the update's Setup is missing ($Setup)" }
  $t0 = Get-Date
  while ((Mine).Count) { if (((Get-Date) - $t0).TotalSeconds -gt 60) { Say 'ERAVOS is still running after 60 s - ending it'; Mine | Stop-Process -Force; Start-Sleep 2; break }; Start-Sleep -Milliseconds 400 }
  Say 'ERAVOS has closed'
  if ($Setup) {
    # /S silent, /D= the folder it is in now (last, unquoted)
    $p = Start-Process -FilePath $Setup -ArgumentList '/S', "/D=$Dest" -Wait -PassThru
    if ($p.ExitCode -ne 0) { throw "ERAVOS Setup ended with code $($p.ExitCode)" }
    Say 'Setup put the new version in'; Done $true "ERAVOS $Version is installed"
  } else {
  $backup = Join-Path $Work 'backup'
  if (Test-Path $backup) { Remove-Item $backup -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $backup | Out-Null
  Copy-Tree $Dest $backup; Say 'backed up the app'
  try {
    Copy-Tree $Staged $Dest; Say 'new files in place'
    Done $true "ERAVOS $Version is installed"
  } catch {
    Say "copying failed: $($_.Exception.Message) - putting the backup back"
    Copy-Tree $backup $Dest; Say 'backup restored'
    Done $false "The update could not be put in place, so ERAVOS was left as it was: $($_.Exception.Message)"
  }
  }
} catch {
  Write-Host "ERAVOS Update failed: $($_.Exception.Message) at $($_.InvocationInfo.PositionMessage)"
  try { Say "failed: $($_.Exception.Message)"; Done $false $_.Exception.Message } catch { Write-Host "could not write the log: $($_.Exception.Message)" }
}
Say 'starting ERAVOS'
# through Explorer: ERAVOS starts as you, not as admin (ERAVOS Update may have needed admin for Program Files)
Start-Process explorer.exe -ArgumentList "`"$exe`""
