/* ERAVOS desktop — updater.js (3.99, rebuilt 3.111). Asked: "an update service to check GitHub for updates with a toast asking to
 * update it" · then "It needs to run in the background? Like maybe an update tool. It closes the canvas and then doesn't apply the update".
 * What went wrong before (3.99): it closed ERAVOS first and then did everything in a hidden script that only waited for the main process
 * — Electron's helper processes keep the files locked a moment longer, the script stopped half way, nothing restarted, nothing was logged.
 * Now, in the background while you keep working:
 *   check     at start (after 15 s) and every 6 hours: GitHub's latest release, newer than this app → 'available' (the page asks)
 *   download  Update → the release's ERAVOS_<v>.zip streams to .appdata/update/ ('downloading', with how far)
 *   unpack    a hidden PowerShell Expand-Archive, ERAVOS still running → 'ready' (the page: Restart now · When I close ERAVOS)
 *   apply     ERAVOS Update (desktop/apply-update.ps1), its own process: waits for EVERY ERAVOS process from this folder to close,
 *             backs up the app, copies the new files (retrying locked ones), restores the backup on any failure, logs, restarts ERAVOS
 *   report    at the next start: update-result.json → 'applied' or 'failed' (with the log)
 * Installed by ERAVOS-Setup (Program Files): the update is the new Setup, downloaded in the background, run silently by ERAVOS Update
 * (Windows asks for admin once). Never in the project folder itself (a git checkout updates with git).
 *   create({ app, net, shell, appDir, workDir, send }) → { start, check(manual), download(), apply(), onQuit(), status } */
'use strict';
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const REPO = 'HorrisEllis/Eravos-Canvas', API = `https://api.github.com/repos/${REPO}/releases/latest`;
const EVERY = 6 * 60 * 60 * 1000, FIRST = 15 * 1000, UA = { 'User-Agent': 'ERAVOS-updater' };

// '1.2.10' > '1.2.9'; a 'v' in front and anything after a '-' are ignored
function newer(a, b) {
  const p = (v) => String(v || '').replace(/^v/i, '').split('-')[0].split('.').map(n => parseInt(n, 10) || 0);
  const x = p(a), y = p(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); }
  return false;
}
// the unpacked release: its ERAVOS.exe is at the top, or one folder down (the build zips an ERAVOS\ folder)
function stagedRoot(dir) {
  if (fs.existsSync(path.join(dir, 'ERAVOS.exe'))) return dir;
  for (const n of fs.existsSync(dir) ? fs.readdirSync(dir) : []) { const d = path.join(dir, n); if (fs.existsSync(path.join(d, 'ERAVOS.exe'))) return d; }
  return null;
}
const run = (cmd, args) => new Promise((res) => { const p = spawn(cmd, args, { windowsHide: true, stdio: 'ignore' }); p.on('exit', (c) => res(c)); p.on('error', () => res(-1)); });

function create(o) {
  const { app, net, shell, appDir, send } = o, work = o.workDir || path.join(appDir, '.appdata', 'update');
  const RESULT = path.join(work, 'update-result.json');
  let latest = null, timer = null, state = 'idle', staged = null, applyOnQuit = false, busy = null;
  const tell = (m) => { state = m.state || state; try { send(m); } catch (e) {} };
  const canApply = () => process.platform === 'win32' && fs.existsSync(path.join(appDir, 'ERAVOS.exe')) && !fs.existsSync(path.join(appDir, '.git'));
  // installed by ERAVOS-Setup (Program Files — "Uninstall ERAVOS.exe" beside ERAVOS.exe): the update is the new Setup, run silently;
  // a portable copy: the zip, unpacked and copied in. Either way ERAVOS Update needs admin where ERAVOS cannot write (Program Files).
  const viaSetup = () => fs.existsSync(path.join(appDir, 'Uninstall ERAVOS.exe'));
  const canWrite = () => { try { const t = path.join(appDir, '.update-test'); fs.writeFileSync(t, ''); fs.unlinkSync(t); return true; } catch (e) { return false; } };

  async function check(manual) {
    try {
      const r = await net.fetch(API, { headers: Object.assign({ Accept: 'application/vnd.github+json' }, UA) });
      if (!r.ok) { if (manual) tell({ state: 'error', message: r.status === 404 ? 'no release is published yet' : 'GitHub said ' + r.status }); return null; }
      const rel = await r.json(), version = String(rel.tag_name || '').replace(/^v/i, '');
      const asset = (rel.assets || []).find(a => /^ERAVOS_.*\.zip$/i.test(a.name)), setup = (rel.assets || []).find(a => /^ERAVOS-Setup-.*\.exe$/i.test(a.name));
      latest = { version, current: app.getVersion(), name: rel.name || ('ERAVOS ' + version), notes: String(rel.body || '').slice(0, 1200), page: rel.html_url,
        zip: asset ? asset.browser_download_url : null, size: asset ? asset.size : 0, setup: setup ? setup.browser_download_url : null, setupSize: setup ? setup.size : 0 };
      latest.canInstall = canApply() && (viaSetup() ? !!latest.setup : !!latest.zip);
      if (newer(version, app.getVersion())) { if (state === 'ready' && staged) tell(Object.assign({ state: 'ready' }, latest)); else tell(Object.assign({ state: 'available', manual: !!manual }, latest)); return latest; }
      if (manual) tell({ state: 'current', version: app.getVersion() });
      return null;
    } catch (e) { if (manual) tell({ state: 'error', message: e.message }); return null; }
  }

  // download + unpack, in the background; ERAVOS keeps running
  function download() {
    if (busy) return busy;
    busy = (async () => {
      try {
        if (!latest) await check(true);
        if (!latest || !newer(latest.version, app.getVersion())) return false;
        if (!latest.canInstall) { shell.openExternal(latest.page); return false; }
        fs.mkdirSync(work, { recursive: true });
        const setup = viaSetup(), url = setup ? latest.setup : latest.zip, size = setup ? latest.setupSize : latest.size;
        const zip = path.join(work, setup ? `ERAVOS-Setup-${latest.version}.exe` : `ERAVOS_${latest.version}.zip`), part = zip + '.part', into = path.join(work, 'staged-' + latest.version);
        if (!fs.existsSync(zip)) {
          const r = await net.fetch(url, { headers: UA }); if (!r.ok || !r.body) throw new Error('download: GitHub said ' + r.status);
          const total = +r.headers.get('content-length') || size || 0, out = fs.createWriteStream(part), rd = r.body.getReader();
          let got = 0, lastTold = 0;
          for (;;) { const { done, value } = await rd.read(); if (done) break; got += value.length; if (!out.write(Buffer.from(value))) await new Promise(res => out.once('drain', res));
            const now = Date.now(); if (now - lastTold > 400) { lastTold = now; tell({ state: 'downloading', version: latest.version, got, total }); } }
          await new Promise((res, rej) => out.end((e) => e ? rej(e) : res()));
          if (total && got !== total) throw new Error(`download stopped at ${got} of ${total} bytes`);
          fs.renameSync(part, zip);
        }
        if (setup) { staged = { setup: zip, version: latest.version }; tell(Object.assign({ state: 'ready' }, latest)); return true; }   // the Setup unpacks itself
        tell({ state: 'unpacking', version: latest.version });
        if (fs.existsSync(into)) fs.rmSync(into, { recursive: true, force: true });
        const lit = (s) => "'" + s.replace(/'/g, "''") + "'";
        const code = await run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `Expand-Archive -LiteralPath ${lit(zip)} -DestinationPath ${lit(into)} -Force`]);
        const root = stagedRoot(into); if (code !== 0 || !root) throw new Error('the download could not be unpacked (it may be damaged) — try again');
        staged = { root, version: latest.version };
        tell(Object.assign({ state: 'ready' }, latest));
        return true;
      } catch (e) { tell({ state: 'error', message: e.message }); return false; } finally { busy = null; }
    })();
    return busy;
  }

  // ERAVOS Update, its own process; Windows asks for admin once where ERAVOS cannot write its own folder (Program Files)
  function launch(st) {
    const script = path.join(__dirname, 'apply-update.ps1'); if (!fs.existsSync(script)) { tell({ state: 'error', message: 'ERAVOS Update (apply-update.ps1) is missing from this build' }); return false; }
    try { fs.rmSync(RESULT, { force: true }); } catch (e) {}
    const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', script, '-Dest', appDir, '-Version', st.version, '-Work', work].concat(st.setup ? ['-Setup', st.setup] : ['-Staged', st.root]);
    const q = (a) => String(a).replace(/'/g, "''");
    if (st.setup || !canWrite()) spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', `Start-Process powershell.exe -Verb RunAs -WindowStyle Hidden -ArgumentList '${args.map(a => `"${q(a)}"`).join(' ')}'`], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    else spawn('powershell.exe', args, { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    return true;
  }
  // Restart now: hand over, then close; ERAVOS Update starts ERAVOS again when it is done
  function apply() {
    if (!staged || !launch(staged)) return false;
    staged = null; applyOnQuit = false;
    tell({ state: 'restarting', version: latest && latest.version });
    setTimeout(() => app.quit(), 300);
    return true;
  }
  function later() { if (staged) { applyOnQuit = true; tell({ state: 'on-close', version: staged.version }); } return applyOnQuit; }
  // ERAVOS is closing with an update waiting to go in
  function onQuit() { if (applyOnQuit && staged) { const s = staged; applyOnQuit = false; staged = null; launch(s); } }

  // what the last update did (read once, at start)
  function report() {
    try { if (!fs.existsSync(RESULT)) return null; const r = JSON.parse(fs.readFileSync(RESULT, 'utf8').replace(/^﻿/, '')); fs.rmSync(RESULT, { force: true });
      // tidy: the zip and unpacked copy of a version now running are no longer needed
      if (r.ok) fs.readdirSync(work).filter(n => /^(ERAVOS_.*\.zip|ERAVOS-Setup-.*\.exe|staged-.*|backup)$/.test(n)).forEach(n => { try { fs.rmSync(path.join(work, n), { recursive: true, force: true }); } catch (e) {} });
      return Object.assign({ state: r.ok && app.getVersion() === r.version ? 'applied' : 'failed' }, r);
    } catch (e) { return null; }
  }
  function start() { const r = report(); if (r) setTimeout(() => tell(r), 2500); setTimeout(() => check(false), FIRST); timer = setInterval(() => check(false), EVERY); }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  return { start, stop, check, download, apply, later, onQuit, report, get status() { return { state, staged: staged && staged.version, latest, applyOnQuit, canApply: canApply() }; }, get latest() { return latest; } };
}
module.exports = { create, newer, stagedRoot, REPO };
