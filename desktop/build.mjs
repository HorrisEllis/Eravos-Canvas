#!/usr/bin/env node
/* Build ERAVOS.exe (Windows x64, portable folder) — Node built-ins only. Run from anywhere:
 *   node desktop/build.mjs                         downloads the pinned Electron (desktop/package.json electronVersion)
 *   node desktop/build.mjs --electron-zip <zip>    uses an Electron win32-x64 zip you already have
 *   node desktop/build.mjs --out <folder>          default: <repo>/../ERAVOS-windows
 *   node desktop/build.mjs --no-electron           the overlay only (canvas/ tools/ schemas/ resources/app + READ ME) — what
 *                                                  packaging/windows/make-exe.ps1 wraps around Electron on a PC without Node
 * Result: <out>/ERAVOS/ERAVOS.exe beside canvas/ tools/ schemas/ (the repo's layout); resources/app holds main.js + preload.js.
 * Same as electron-packager does, minus rcedit (icon/version info) which needs Windows or wine — declared in the spec. */
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
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
// The exe folder has the project's layout: canvas/ tools/ schemas/ README.md beside ERAVOS.exe, the same folders as the
// repo, so the exe loads every domain from tools/ exactly like the dev build. Your folders sit next to them and survive a rebuild.
const SHIP = ['canvas', 'tools', 'schemas', 'README.md'];
const KEEP = ['projects', 'exports', 'drop', 'packs', 'voice', '.appdata', 'ERAVOS Library'];   // yours — never deleted by a rebuild
const OVERLAY = process.argv.includes('--no-electron');

say('assembling ' + APP);
fs.mkdirSync(APP, { recursive: true });
for (const n of fs.readdirSync(APP)) if (!KEEP.includes(n)) fs.rmSync(path.join(APP, n), { recursive: true, force: true });
if (!OVERLAY) {
  extract(await electronZip(), APP);
  fs.renameSync(path.join(APP, 'electron.exe'), path.join(APP, 'ERAVOS.exe'));
  fs.rmSync(path.join(APP, 'resources', 'default_app.asar'), { force: true });
  const loc = path.join(APP, 'locales'); if (fs.existsSync(loc)) for (const f of fs.readdirSync(loc)) if (!/^en-(US|GB)\.pak$/.test(f)) fs.rmSync(path.join(loc, f));
}
const res = path.join(APP, 'resources', 'app'); fs.mkdirSync(res, { recursive: true });
['main.js', 'preload.js'].forEach(f => fs.copyFileSync(path.join(HERE, f), path.join(res, f)));
fs.writeFileSync(path.join(res, 'package.json'), JSON.stringify({ name: pkg.name, productName: pkg.productName, version: pkg.version, description: pkg.description, author: pkg.author, main: 'main.js', private: true }, null, 2));
for (const s of SHIP) { const src = path.join(ROOT, s), dst = path.join(APP, s); if (fs.statSync(src).isDirectory()) copyDir(src, dst, (rel, n) => n === 'node_modules' || n.startsWith('.')); else fs.copyFileSync(src, dst); }
if (fs.existsSync(path.join(ROOT, 'voice')) && !fs.existsSync(path.join(APP, 'voice'))) copyDir(path.join(ROOT, 'voice'), path.join(APP, 'voice'));   // her recordings travel with the exe
say('canvas/ + tools/ (' + fs.readdirSync(path.join(ROOT, 'tools')).filter(d => fs.existsSync(path.join(ROOT, 'tools', d, 'index.js'))).join(', ') + ') + schemas/ → ' + APP);
fs.writeFileSync(path.join(APP, 'READ ME FIRST.txt'), [
  'ERAVOS ' + pkg.version, '',
  'Double-click ERAVOS.exe - no install, no browser, nothing else needed.', '',
  'First launch: Windows may say "Windows protected your PC" because this build is not code-signed yet.',
  'Click "More info" then "Run anyway". It only asks once.', '',
  'This folder has the same layout as the ERAVOS project:',
  '  canvas\\    the canvas (kernel, runtime)',
  '  tools\\     every tool, one folder per domain (tools\\music, tools\\image, tools\\video, ...)',
  '  schemas\\   the formats tools and packs follow',
  'Your folders appear next to them on first run, and a rebuild never touches them:',
  '  projects\\  Session > Save writes here      exports\\  bounced WAVs and other exports',
  '  drop\\      put sounds, .mid files, packs or projects here; they appear on the canvas',
  '  packs\\     extra tool packs (.zip) - loaded every start; packs dropped on the canvas are kept here',
  '  .appdata\\  ERAVOS\'s own storage (autosave, presets)', '',
  'Coming from an older build? Your old "ERAVOS Library" projects, exports and autosave move across on first start.', '',
  'MIDI pads/keys: plug in, then MIDI Map > Connect MIDI. Close other music apps first - Windows lets only one app use a MIDI device at a time.',
  'Move or back up everything: copy this whole ERAVOS folder.', ''].join('\r\n'));
say('done → ' + (OVERLAY ? APP + ' (overlay — packaging/windows/make-exe.ps1 adds Electron)' : path.join(APP, 'ERAVOS.exe')));
