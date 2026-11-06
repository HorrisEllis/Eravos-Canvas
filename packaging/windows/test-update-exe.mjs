// node packaging/windows/test-update-exe.mjs — run by the release workflow on Windows after the build (3.141). The whole update, the way
// ERAVOS does it, with the real built ERAVOS Update.exe and the real built Setup (his: "it never closes, or does anything else to
// update" · "why not make it another exe?"). An "installed" folder (a Setup install: ERAVOS.exe, Uninstall ERAVOS.exe, ERAVOS Update.exe)
// gets Restart now: desktop/updater.js starts ERAVOS Update.exe → it says it started (ERAVOS would close) → it runs the Setup (on the
// runner Windows' permission step passes without a prompt) into that folder → the result file says ok, the new version is installed.
import fs from 'fs'; import os from 'os'; import path from 'path'; import { createRequire } from 'module'; import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url), ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), U = require(ROOT + '/desktop/updater.js');
const fail = (m) => { console.error('FAIL: ' + m); process.exit(1); }, say = (m) => console.log('  ' + m);
const version = JSON.parse(fs.readFileSync(ROOT + '/desktop/package.json', 'utf8')).version;
const built = path.join(ROOT, 'dist', 'ERAVOS'), exe = path.join(built, 'ERAVOS Update.exe'), setup = path.join(ROOT, 'dist', `ERAVOS-Setup-${version}.exe`);
if (!fs.existsSync(exe)) fail('the build has no ERAVOS Update.exe (' + exe + ')'); if (!fs.existsSync(setup)) fail('no ' + setup);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eravos update exe ')), dir = path.join(tmp, 'Program Files', 'ERAVOS'), work = path.join(tmp, 'Documents', 'ERAVOS', '.appdata', 'update');
fs.mkdirSync(dir, { recursive: true }); fs.copyFileSync(exe, path.join(dir, 'ERAVOS Update.exe')); ['ERAVOS.exe', 'Uninstall ERAVOS.exe'].forEach(f => fs.writeFileSync(path.join(dir, f), ''));
const bytes = fs.readFileSync(setup);
const net = { fetch: async (url) => /releases\/latest/.test(url)
  ? { ok: true, status: 200, json: async () => ({ tag_name: 'v' + version, body: '', html_url: 'x', assets: [{ name: `ERAVOS-Setup-${version}.exe`, browser_download_url: 'https://dl/setup', size: bytes.length }] }) }
  : (() => { let done = false; return { ok: true, status: 200, headers: { get: () => String(bytes.length) }, body: { getReader: () => ({ read: async () => done ? { done: true } : (done = true, { done: false, value: new Uint8Array(bytes) }) }) } }; })() };
let quits = 0; const told = []; const app = { getVersion: () => '0.0.1', quit: () => { quits++; } };
const u = U.create({ app, net, shell: { openExternal() {}, openPath: async () => '' }, appDir: dir, workDir: work, noStart: true, startWaitMs: 60000, send: (m) => { told.push(m); say('told: ' + m.state + (m.message ? ' — ' + m.message : '')); } });
await u.check(false); if (!(await u.download())) fail('the Setup was not staged');
const t0 = Date.now(); const ok = await u.apply(); say(`apply → ${ok} after ${Date.now() - t0} ms`);
if (!ok) fail('ERAVOS Update.exe did not say it started: ' + JSON.stringify(told.slice(-2)));
await new Promise(r => setTimeout(r, 600)); if (quits !== 1) fail('ERAVOS did not close once the update started');
const res = path.join(work, 'update-result.json'); const t1 = Date.now(); while (!fs.existsSync(res) && Date.now() - t1 < 240000) await new Promise(r => setTimeout(r, 1000));
const log = path.join(work, 'update.log'); if (fs.existsSync(log)) fs.readFileSync(log, 'utf8').split(/\r?\n/).filter(Boolean).forEach(l => say('LOG ' + l));
if (!fs.existsSync(res)) fail('no update-result.json after 4 minutes');
const r = JSON.parse(fs.readFileSync(res, 'utf8').replace(/^﻿/, '')); say('result: ' + JSON.stringify(r));
if (r.ok !== true) fail('the update did not go in: ' + r.message);
for (const f of ['ERAVOS.exe', 'ERAVOS Update.exe', path.join('resources', 'app', 'updater.js'), path.join('canvas', 'index.html')]) if (!fs.statSync(path.join(dir, f), { throwIfNoEntry: false })?.size) fail('not installed: ' + f);
console.log('ERAVOS Update.exe: ok — Restart now → started → Setup → ERAVOS ' + version + ' installed into a folder with a space in its path');
