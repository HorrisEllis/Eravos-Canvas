// node desktop/test/updater.mjs — the update service without Electron or GitHub (3.111): a fake GitHub, a fake app, a temp folder.
// Checks: a newer release is told as 'available'; the download streams to disk while 'downloading' reports progress; a project
// folder (a git checkout) is never updated in place; a missing helper or unpack failure is an error, not a closed ERAVOS; the
// result of the last update is read back once at the next start (applied / failed) and the leftovers are tidied.
import fs from 'fs'; import os from 'os'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url), U = require('../updater.js');
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eravos-upd-'));
const ZIP = Buffer.alloc(300000, 7);
const fakeNet = { fetch: async (url) => {
  if (/releases\/latest/.test(url)) return { ok: true, status: 200, json: async () => ({ tag_name: 'v0.2.0', name: 'ERAVOS 0.2.0', body: '- Field theme\n- Wobble Bass Suite', html_url: 'https://github.com/x/releases/v0.2.0',
    assets: [{ name: 'ERAVOS_0.2.0.zip', browser_download_url: 'https://dl/ERAVOS_0.2.0.zip', size: ZIP.length }] }) };
  // the zip, in pieces
  let i = 0; const parts = [ZIP.subarray(0, 100000), ZIP.subarray(100000, 200000), ZIP.subarray(200000)];
  return { ok: true, status: 200, headers: { get: () => String(ZIP.length) }, body: { getReader: () => ({ read: async () => { await new Promise(r => setTimeout(r, 450)); return i < parts.length ? { done: false, value: new Uint8Array(parts[i++]) } : { done: true }; } }) } };
} };
let quits = 0; const fakeApp = (v) => ({ getVersion: () => v, quit: () => { quits++; } });
const shell = { openExternal: (u) => { shell.opened = u; } };

console.log('updater');
ok(U.newer('v0.2.0', '0.1.0') && !U.newer('0.1.0', '0.1.0') && U.newer('1.2.10', '1.2.9') && !U.newer('0.9.9', '1.0.0'), 'versions compare as numbers');
ok(U.newer('0.2.16-beta.4', '0.2.15') && U.newer('0.2.16-beta.4', '0.2.16-beta.3') && !U.newer('0.2.16-beta.4', '0.2.16') && U.newer('0.2.16', '0.2.16-beta.9') && !U.newer('0.2.16-beta.3', '0.2.16-beta.3'),
  'betas: after the last release and the earlier betas, before their own release (3.148)');
// 3.148 channels: stable reads GitHub's latest release; beta the newest of the releases and pre-releases (every merge to main)
{ const rel = (tag, pre, files) => ({ tag_name: tag, prerelease: pre, draft: false, name: 'ERAVOS ' + tag, body: '', html_url: 'https://gh/' + tag, assets: (files || ['zip', 'setup']).map(k => ({ name: k === 'zip' ? `ERAVOS_${tag.slice(1)}.zip` : `ERAVOS-Setup-${tag.slice(1)}.exe`, browser_download_url: 'https://dl/' + tag + k, size: 10 })) });
  const LIST = [rel('v0.2.16-beta.3', true), rel('v0.2.16-beta.12', true), rel('v0.2.16-beta.13', true, []), rel('v0.2.15', false), rel('v0.2.14', false)];
  const net = { fetch: async (url) => /releases\/latest/.test(url) ? { ok: true, status: 200, json: async () => LIST[3] } : /releases\?/.test(url) ? { ok: true, status: 200, json: async () => LIST } : { ok: false, status: 404 } };
  const dir = path.join(tmp, 'chan'), work = path.join(dir, 'w'); fs.mkdirSync(dir, { recursive: true });
  const told = [], u = U.create({ app: fakeApp('0.2.15'), net, shell, appDir: dir, workDir: work, send: (m) => told.push(m) });
  ok(u.getChannel() === 'stable', 'stable by default');
  ok(await u.check(true) === null && told.some(m => m.state === 'current'), 'stable on 0.2.15: no update (the newest release is 0.2.15)');
  ok(u.setChannel('beta') === 'beta' && u.getChannel() === 'beta' && JSON.parse(fs.readFileSync(path.join(work, 'channel.json'), 'utf8')).channel === 'beta', 'beta is kept (channel.json)');
  const r = await u.check(true); ok(r && r.version === '0.2.16-beta.12' && r.beta === true, 'beta on 0.2.15: the newest beta that has something to install (0.2.16-beta.12; beta.13 has no files yet)');
  ok(u.setChannel('nightly') === 'beta', 'an unknown channel is refused');
  const b = U.create({ app: fakeApp('0.2.16-beta.3'), net, shell, appDir: dir, workDir: path.join(tmp, 'chan2'), send: () => {} }); ok(b.getChannel() === 'beta', 'a beta build starts on the beta channel'); }
{ const d = path.join(tmp, 'zipdir'); fs.mkdirSync(path.join(d, 'ERAVOS'), { recursive: true }); fs.writeFileSync(path.join(d, 'ERAVOS', 'ERAVOS.exe'), '');
  ok(U.stagedRoot(d) === path.join(d, 'ERAVOS'), 'finds the app one folder down in the unpacked zip'); }

// 1. a newer release → available; the project folder (a .git checkout) is never updated in place: the release page opens instead
{ const dir = path.join(tmp, 'repo'); fs.mkdirSync(path.join(dir, '.git'), { recursive: true }); fs.writeFileSync(path.join(dir, 'ERAVOS.exe'), '');
  const told = []; const u = U.create({ app: fakeApp('0.1.0'), net: fakeNet, shell, appDir: dir, send: (m) => told.push(m) });
  const r = await u.check(true); ok(r && r.version === '0.2.0' && told.some(m => m.state === 'available' && m.version === '0.2.0'), 'a newer release is told as available');
  ok(r.canInstall === false, 'a project folder cannot install it'); const d = await u.download(); ok(d === false && shell.opened === r.page, '… so Update opens the release page'); }

// 2. an installed app: the download streams to disk with progress, ERAVOS stays open (never quits before the update is ready)
{ const dir = path.join(tmp, 'app'), work = path.join(dir, '.appdata', 'update'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'ERAVOS.exe'), '');
  const told = []; const app = fakeApp('0.1.0'); const u = U.create({ app, net: fakeNet, shell, appDir: dir, workDir: work, send: (m) => told.push(m) });
  Object.defineProperty(process, 'platform', { value: 'win32' });   // as on Windows (the unpack step then fails here: no PowerShell)
  await u.check(false); const res = await u.download();
  const zip = path.join(work, 'ERAVOS_0.2.0.zip');
  ok(fs.existsSync(zip) && fs.statSync(zip).size === ZIP.length, 'the whole zip is on disk');
  ok(told.some(m => m.state === 'downloading' && m.total === ZIP.length && m.got > 0 && m.got < ZIP.length), 'progress is told while it downloads');
  ok(told.some(m => m.state === 'unpacking'), 'then it unpacks, in the background');
  ok(res === false && told.some(m => m.state === 'error' && /unpacked/.test(m.message)), 'an unpack that fails is an error the page shows');
  ok(quits === 0, 'and ERAVOS was never closed');
  ok((await u.apply()) === false, 'with nothing ready, Restart now does nothing');

  // 3. the next start: the helper's result is read once and told; a success tidies the download away
  fs.writeFileSync(path.join(work, 'update-result.json'), '﻿' + JSON.stringify({ ok: true, version: '0.1.0', message: 'ERAVOS 0.1.0 is installed', log: path.join(work, 'update.log') }));
  const r = u.report(); ok(r && r.state === 'applied', 'a good result is told as applied');
  ok(!fs.existsSync(zip) && !fs.existsSync(path.join(work, 'update-result.json')), 'and the download and the result are tidied away');
  fs.writeFileSync(path.join(work, 'update-result.json'), JSON.stringify({ ok: false, version: '0.2.0', message: 'robocopy failed (16)', log: 'x' }));
  const f = u.report(); ok(f && f.state === 'failed' && /robocopy/.test(f.message), 'a failed one is told as failed, with why');
  ok(u.report() === null, 'and only once'); }

// 4. (3.141) an installed copy (Setup): Restart now starts ERAVOS Update.exe; if it cannot start, ERAVOS says why at once (not after a
//    minute) and stays open; Cancel ends the wait; Run the installer myself opens the Setup and then closes ERAVOS
{ const dir = path.join(tmp, 'installed'), work = path.join(tmp, 'lib', '.appdata', 'update'); fs.mkdirSync(dir, { recursive: true });
  ['ERAVOS.exe', 'Uninstall ERAVOS.exe', 'ERAVOS Update.exe'].forEach(f => fs.writeFileSync(path.join(dir, f), ''));
  const SETUP = Buffer.alloc(1000, 3), setupNet = { fetch: async (url) => {
    if (/releases\/latest/.test(url)) return { ok: true, status: 200, json: async () => ({ tag_name: 'v0.3.0', body: '', html_url: 'x', assets: [{ name: 'ERAVOS-Setup-0.3.0.exe', browser_download_url: 'https://dl/setup', size: SETUP.length }] }) };
    let done = false; return { ok: true, status: 200, headers: { get: () => String(SETUP.length) }, body: { getReader: () => ({ read: async () => done ? { done: true } : (done = true, { done: false, value: new Uint8Array(SETUP) }) }) } }; } };
  const told = [], app = fakeApp('0.2.0'), opened = []; const sh = { openExternal() {}, openPath: async (f) => { opened.push(f); return ''; } };
  const u = U.create({ app, net: setupNet, shell: sh, appDir: dir, workDir: work, startWaitMs: 4000, send: (m) => told.push(m) });
  await u.check(false); ok(await u.download(), 'the Setup is downloaded and ready');
  const t0 = Date.now(); const r = await u.apply(), took = Date.now() - t0;
  ok(r === false && told.some(m => m.state === 'error' && /ERAVOS Update\.exe/.test(m.message)), 'an ERAVOS Update.exe that cannot start: told why — ' + (told.filter(m => m.state === 'error').pop() || {}).message);
  ok(took < 3000, `… at once (${took} ms), not after the wait`); ok(told[told.length - 1].state === 'ready' && quits === 0, '… ERAVOS stays open, the update still ready');
  fs.rmSync(path.join(dir, 'ERAVOS Update.exe'));   // no exe: the PowerShell path (it cannot start here either), then Cancel
  const p2 = u.apply(); await new Promise(res => setTimeout(res, 300)); u.cancel(); const r2 = await p2;
  ok(r2 === false && told[told.length - 1].state === 'ready', 'Cancel ends the wait; the update is still ready');
  const m = await u.manual(); ok(m === true && opened[0] && /ERAVOS-Setup-0\.3\.0\.exe$/.test(opened[0]), 'Run the installer myself opens the downloaded Setup');
  await new Promise(res => setTimeout(res, 1700)); ok(quits === 1, '… and then ERAVOS closes (the installer replaces its files)'); }

fs.rmSync(tmp, { recursive: true, force: true });
console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
