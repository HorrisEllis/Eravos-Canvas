/* ERAVOS desktop — updater.js (3.99). Asked: "an installer for eravos with an update service to check GitHub for updates with a toast
 * asking to update it".
 * At start (after a short wait) and every 6 hours it asks GitHub for the latest release of the project. A release newer than this app
 * (its tag vX.Y.Z against package.json's version) is told to the page (eravos:update → a toast: Update now · Later · What's new).
 * Update now: the release's ERAVOS_<version>.zip (built by .github/workflows/release.yml) is downloaded, and a small PowerShell script
 * waits for ERAVOS to close, puts the new app files in place — never your projects, exports, drop, packs or .appdata — and starts it
 * again. Where there is no zip (or not on Windows) it opens the release page instead.
 *   create({ app, net, shell, appDir, send }) → { check(manual) → info|null, install() → started? } */
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), { spawn } = require('child_process');
const REPO = 'HorrisEllis/Eravos-Canvas', API = `https://api.github.com/repos/${REPO}/releases/latest`;
const EVERY = 6 * 60 * 60 * 1000, FIRST = 15 * 1000;
const KEEP = ['projects', 'exports', 'drop', 'packs', '.appdata', 'ERAVOS Library'];

// '1.2.10' > '1.2.9'; a 'v' in front and anything after a '-' are ignored
function newer(a, b) {
  const p = (v) => String(v || '').replace(/^v/i, '').split('-')[0].split('.').map(n => parseInt(n, 10) || 0);
  const x = p(a), y = p(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); }
  return false;
}

function create(o) {
  const { app, net, shell, appDir, send } = o;
  let latest = null, timer = null;
  async function check(manual) {
    try {
      const r = await net.fetch(API, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ERAVOS-updater' } });
      if (!r.ok) { if (manual) send({ state: 'error', message: 'GitHub said ' + r.status }); return null; }
      const rel = await r.json(), version = String(rel.tag_name || '').replace(/^v/i, '');
      const asset = (rel.assets || []).find(a => /^ERAVOS_.*\.zip$/i.test(a.name));
      latest = { version, current: app.getVersion(), name: rel.name || ('ERAVOS ' + version), notes: String(rel.body || '').slice(0, 1200), page: rel.html_url, zip: asset ? asset.browser_download_url : null, size: asset ? asset.size : 0 };
      if (newer(version, app.getVersion())) { send(Object.assign({ state: 'available' }, latest)); return latest; }
      if (manual) send({ state: 'current', version: app.getVersion() });
      return null;
    } catch (e) { if (manual) send({ state: 'error', message: e.message }); return null; }
  }
  function start() { setTimeout(() => check(false), FIRST); timer = setInterval(() => check(false), EVERY); }
  function stop() { if (timer) clearInterval(timer); timer = null; }

  async function install() {
    if (!latest) await check(true);
    if (!latest || !newer(latest.version, app.getVersion())) return false;
    if (process.platform !== 'win32' || !latest.zip) { shell.openExternal(latest.page); return false; }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eravos-update-')), zip = path.join(dir, 'ERAVOS.zip');
    send({ state: 'downloading', version: latest.version, size: latest.size });
    const r = await net.fetch(latest.zip, { headers: { 'User-Agent': 'ERAVOS-updater' } });
    if (!r.ok) { send({ state: 'error', message: 'download: ' + r.status }); return false; }
    fs.writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
    // the swap runs after ERAVOS has closed (its own files are in use while it runs)
    const ps = path.join(dir, 'apply.ps1'), exe = path.join(appDir, 'ERAVOS.exe');
    fs.writeFileSync(ps, [
      "$ErrorActionPreference = 'Stop'",
      `$zip = '${zip.replace(/'/g, "''")}'; $dest = '${appDir.replace(/'/g, "''")}'; $pid0 = ${process.pid}`,
      `$keep = @(${KEEP.map(k => `'${k}'`).join(', ')})`,
      'while (Get-Process -Id $pid0 -ErrorAction SilentlyContinue) { Start-Sleep -Milliseconds 300 }',
      "$stage = Join-Path (Split-Path $zip) 'new'; Expand-Archive -Path $zip -DestinationPath $stage -Force",
      '$root = $stage; $inner = Join-Path $stage \'ERAVOS\'; if (Test-Path (Join-Path $inner \'ERAVOS.exe\')) { $root = $inner }',
      'Get-ChildItem -Force $dest | Where-Object { $keep -notcontains $_.Name } | Remove-Item -Recurse -Force',
      'Get-ChildItem -Force $root | Where-Object { $keep -notcontains $_.Name } | Copy-Item -Destination $dest -Recurse -Force',
      `Start-Process '${exe.replace(/'/g, "''")}'`,
    ].join('\r\n'), 'utf8');
    spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', ps], { detached: true, stdio: 'ignore' }).unref();
    send({ state: 'restarting', version: latest.version });
    setTimeout(() => app.quit(), 400);
    return true;
  }
  return { check, install, start, stop, get latest() { return latest; } };
}
module.exports = { create, newer, REPO };
