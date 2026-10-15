#!/usr/bin/env node
/* Build ERAVOS.exe (Windows x64, portable folder) — Node built-ins only. Run from anywhere:
 *   node desktop/build.mjs                         downloads the pinned Electron (desktop/package.json electronVersion)
 *   node desktop/build.mjs --electron-zip <zip>    uses an Electron win32-x64 zip you already have
 *   node desktop/build.mjs --out <folder>          default: <repo>/../ERAVOS-windows
 *   node desktop/build.mjs --no-electron           the overlay only (resources/app + ERAVOS Library + READ ME) — what
 *                                                  packaging/windows/make-exe.ps1 wraps around Electron on a PC without Node
 * Result: <out>/ERAVOS/ERAVOS.exe + resources/app (the canvas). ERAVOS Library is created next to the exe on first run.
 * Same as electron-packager does, minus rcedit (icon/version info) which needs Windows or wine — declared in the spec. */
import fs from 'fs'; import path from 'path'; import { buildPacks } from './packs.mjs'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const pkg = JSON.parse(fs.readFileSync(path.join(HERE, 'package.json'), 'utf8'));
const OUT = path.resolve(arg('--out') || path.join(ROOT, '..', 'ERAVOS-windows')), APP = path.join(OUT, 'ERAVOS');
const say = (m) => console.log('› ' + m);

async function electronZip() {
  const given = arg('--electron-zip'); if (given) return path.resolve(given);
  const v = pkg.electronVersion, cache = path.join(ROOT, '..', `.electron-cache`), file = path.join(cache, `electron-v${v}-win32-x64.zip`);
  if (fs.existsSync(file)) return file;
  fs.mkdirSync(cache, { recursive: true });
  const url = `https://github.com/electron/electron/releases/download/v${v}/electron-v${v}-win32-x64.zip`;
  say('downloading Electron ' + v + ' (win32-x64, ~150 MB)…');
  const r = await fetch(url); if (!r.ok) throw new Error(`download failed ${r.status} ${url}`);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); return file;
}
function extract(zip, dst) {
  fs.mkdirSync(dst, { recursive: true });
  try { execFileSync('unzip', ['-q', '-o', zip, '-d', dst], { stdio: 'ignore' }); }
  catch (e) { execFileSync('tar', ['-xf', zip, '-C', dst]); } // Windows 10+ tar.exe reads zip
}
function copyDir(src, dst, skip) {
  fs.mkdirSync(dst, { recursive: true });
  for (const n of fs.readdirSync(src)) {
    const s = path.join(src, n), d = path.join(dst, n), rel = path.relative(ROOT, s).split(path.sep).join('/');
    if (skip(rel, n)) continue;
    if (fs.statSync(s).isDirectory()) copyDir(s, d, skip); else fs.copyFileSync(s, d);
  }
}
// P13: the exe ships the CANVAS only (canvas/ = kernel, runtime, shell). Every tool arrives as a pack in ERAVOS Library › Mods.
const SHIP = ['canvas', 'README.md', 'schemas'];
const OVERLAY = process.argv.includes('--no-electron');

say('assembling ' + APP);
fs.rmSync(APP, { recursive: true, force: true });
if (!OVERLAY) {
  extract(await electronZip(), APP);
  fs.renameSync(path.join(APP, 'electron.exe'), path.join(APP, 'ERAVOS.exe'));
  fs.rmSync(path.join(APP, 'resources', 'default_app.asar'), { force: true });
  const loc = path.join(APP, 'locales'); if (fs.existsSync(loc)) for (const f of fs.readdirSync(loc)) if (!/^en-(US|GB)\.pak$/.test(f)) fs.rmSync(path.join(loc, f));
}
const res = path.join(APP, 'resources', 'app'); fs.mkdirSync(res, { recursive: true });
['main.js', 'preload.js'].forEach(f => fs.copyFileSync(path.join(HERE, f), path.join(res, f)));
fs.writeFileSync(path.join(res, 'package.json'), JSON.stringify({ name: pkg.name, productName: pkg.productName, version: pkg.version, description: pkg.description, author: pkg.author, main: 'main.js', private: true }, null, 2));
for (const s of SHIP) { const src = path.join(ROOT, s), dst = path.join(res, 'eravos', s); if (fs.statSync(src).isDirectory()) copyDir(src, dst, (rel, n) => n === 'node_modules' || n.startsWith('.')); else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); } }
fs.mkdirSync(path.join(res, 'eravos', 'tools'), { recursive: true });
fs.writeFileSync(path.join(res, 'eravos', 'tools', 'index.js'), '/* ERAVOS.exe: no built-in domains — the canvas expands with packs (ERAVOS Library › Packs, or drop a .zip). */\nwindow.ERAVOS_DOMAINS = [];\n');
const packsDir = path.join(APP, 'ERAVOS Library', 'Mods', 'Music'); // 3.30: one folder per domain
fs.rmSync(packsDir, { recursive: true, force: true });
const pk = buildPacks(packsDir); say(`${pk.made.length} packs → ERAVOS Library › Packs (${pk.organisms} tools)`);
fs.writeFileSync(path.join(APP, 'READ ME FIRST.txt'), [
  'ERAVOS ' + pkg.version, '',
  'Double-click ERAVOS.exe. That is the canvas - no install, no browser, nothing else needed.', '',
  'First launch: Windows may say "Windows protected your PC" because this build is not code-signed yet.',
  'Click "More info" then "Run anyway". It only asks once.', '',
  'The ERAVOS Library folder appears next to ERAVOS.exe on first run:',
  '  Drop Here - put sounds, .mid files, packs or projects here; they appear on the canvas.',
  '  Packs     - the tools. ERAVOS itself is only the canvas; everything you can add comes from the packs here.',
  '              Remove a pack to remove its tools; drop a new pack on the canvas to add more (it is kept here).',
  '  Projects / Exports - where Save and Bounce write.', '',
  'MIDI pads/keys: plug in, then MIDI Map > Connect MIDI. Close other music apps first - Windows lets only one app use a MIDI device at a time.',
  'Move or back up everything: copy this whole ERAVOS folder.', ''].join('\r\n'));
say('done → ' + (OVERLAY ? APP + ' (overlay — packaging/windows/make-exe.ps1 adds Electron)' : path.join(APP, 'ERAVOS.exe')));
